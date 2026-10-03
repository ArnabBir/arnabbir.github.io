// Extract only reviewed, self-contained examples; never execute arbitrary fences.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const javaHome = process.env.JAVA_HOME;
if (!javaHome) throw new Error('JAVA_HOME must name JDK 21 or newer');
const base = os.tmpdir();
const work = fs.mkdtempSync(path.join(base, 'practice-java-'));
const imports = 'import java.util.*; import java.util.concurrent.*; import java.util.concurrent.atomic.*; import java.util.concurrent.locks.*; import java.time.*;\n';
const helpers = `
 static void check(boolean ok, String why) { if (!ok) throw new AssertionError(why); }
 static void get(Future<?> f) throws Exception { f.get(3, TimeUnit.SECONDS); }
 static void fails(Future<?> f) throws Exception {
   try { get(f); throw new AssertionError("expected failure"); }
   catch (ExecutionException expected) {}
 }
 static Object field(Object o, String name) throws Exception {
   var f = o.getClass().getDeclaredField(name); f.setAccessible(true); return f.get(o);
 }
 static void set(Object o, String name, Object value) throws Exception {
   var f = o.getClass().getDeclaredField(name); f.setAccessible(true); f.set(o, value);
 }
 static void waitFor(java.util.function.BooleanSupplier test) throws Exception {
   long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
   while (!test.getAsBoolean()) {
     if (System.nanoTime() - end >= 0) throw new AssertionError("boundary not reached");
     Thread.yield();
   }
 }
`;

const suites = [
  {
    chapter: '02-threads-tasks-lifecycle.md', names: ['JoinWithin', 'Service'],
    stubs: {Service: 'void doOneInterruptibleUnit() { Thread.yield(); } void reportFailure(String name, Throwable failure) { throw new AssertionError(failure); }'},
    test: `
      var closedService=new Service();closedService.close();
      try {closedService.start();throw new AssertionError("start after close");}catch(IllegalStateException expected){}
      var startedService=new Service();startedService.start();startedService.close();
      check(!((Thread)field(startedService,"worker")).isAlive(),"service worker leaked");
      var latch=new CountDownLatch(1);Thread worker=new Thread(()->{try{latch.await();}catch(InterruptedException e){Thread.currentThread().interrupt();}});worker.start();
      try {
        check(!JoinWithin.joinWithin(worker,Duration.ZERO),"zero join blocked");
        check(!JoinWithin.joinWithin(worker,Duration.ofNanos(1)),"submillisecond join");
        Thread.currentThread().interrupt();check(!JoinWithin.joinWithin(worker,Duration.ofSeconds(1)),"interrupt result");
        check(Thread.interrupted(),"interrupt lost");
      }finally{latch.countDown();worker.join();}
      check(JoinWithin.joinWithin(worker,Duration.ZERO),"terminated join");
    `,
  },
  {
    chapter: '04-synchronization-locks-conditions.md', names: ['MonitorBoundedQueue', 'ConditionBoundedQueue', 'Inventory', 'PriceBook', 'Point'],
    test: `
      var queue=new ConditionBoundedQueue<Integer>(1);queue.put(1);check(queue.take()==1,"FIFO");
      var task=new FutureTask<Integer>(queue::take);Thread consumer=new Thread(task);consumer.start();consumer.interrupt();fails(task);consumer.join();
      queue.put(2);check(queue.take()==2,"interrupted take consumed");
      var monitor=new MonitorBoundedQueue<Integer>(1);monitor.put(3);check(monitor.take()==3,"monitor queue");
      var stock=new Inventory(1);check(stock.tryReserve(1)&&!stock.tryReserve(1),"inventory");
      var point=new Point();point.move(3,4);check(point.distanceFromOrigin()==5,"optimistic snapshot");
    `,
  },
  {
    chapter: '08-async-parallel-virtual-threads.md', names: ['Deadline', 'ProductAggregator', 'ParallelMergeSort'],
    test: `
      try {new Deadline(0,-1);throw new AssertionError("negative direct budget");}
      catch(IllegalArgumentException expected){}
      check(Deadline.after(Duration.ZERO).remaining().isZero(),"zero deadline");
      var client=new ProductAggregator.CatalogClient(){
        public ProductAggregator.Inventory inventory(String sku,Duration timeout){return new ProductAggregator.Inventory(true);}
        public ProductAggregator.Price price(String sku,Duration timeout){return new ProductAggregator.Price(100,"USD");}
        public List<ProductAggregator.Recommendation> recommendations(String sku,Duration timeout)throws Exception{throw new java.io.IOException("unavailable");}
      };
      var aggregator=new ProductAggregator(client);
      try {
        check(aggregator.aggregate("k",Duration.ofSeconds(2)).get(3,TimeUnit.SECONDS).recommendations().isEmpty(),"optional fallback");
        fails(aggregator.aggregate("k",Duration.ZERO));
      } finally {aggregator.close();}
      fails(aggregator.aggregate("k",Duration.ofSeconds(1)));
      try(var pool=new ForkJoinPool(2)) {
        for(int n:new int[]{0,1,63,64,65,10001}) {
          int[] actual=new SplittableRandom(n).ints(n,-100,101).toArray(), expected=actual.clone();
          Arrays.sort(expected);ParallelMergeSort.sort(actual,64,pool);check(Arrays.equals(actual,expected),"merge sort size "+n);
        }
      }
    `,
  },
  {
    chapter: '09-liveness-debugging-testing.md', names: ['ConcurrentHarness'],
    test: `
      ConcurrentHarness.run(List.of(),Duration.ZERO);var n=new AtomicInteger();
      ConcurrentHarness.run(List.of(n::incrementAndGet,n::incrementAndGet),Duration.ofSeconds(2));check(n.get()==2,"actors");
      try{ConcurrentHarness.run(List.of(()->{throw new IllegalStateException("actor failure");}),Duration.ofSeconds(2));throw new AssertionError("lost failure");}
      catch(ExecutionException expected){check(expected.getCause() instanceof IllegalStateException,"cause");}
    `,
  },
  {
    chapter: '01-interview-method.md', names: ['KeyPool', 'KeyLease', 'LockedKeyPool'],
    test: `
      var p = new LockedKeyPool(Set.of("one"));
      var lease = p.acquire(Duration.ZERO);
      try { p.acquire(Duration.ZERO); throw new AssertionError("overissued"); }
      catch (TimeoutException expected) {}
      try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
        var a = ex.submit(lease::close); var b = ex.submit(lease::close); get(a); get(b);
      }
      var again = p.acquire(Duration.ZERO); again.close(); p.close();
      try { p.acquire(Duration.ZERO); throw new AssertionError("closed admission"); }
      catch (IllegalStateException expected) {}
    `,
  },
  {
    chapter: '05-coordination-primitives.md', names: ['H2O', 'AlternatingPrinter'],
    test: `
      var h = new H2O(); List<Character> out = Collections.synchronizedList(new ArrayList<>());
      try (var ex = Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<?>> fs = new ArrayList<>();
        for (int i=0;i<100;i++) {
          fs.add(ex.submit(() -> { h.oxygen(() -> out.add('O')); return null; }));
          for (int j=0;j<2;j++) fs.add(ex.submit(() -> { h.hydrogen(() -> out.add('H')); return null; }));
        }
        for (var f:fs) get(f);
      }
      check(out.size()==300,"atom count");
      for(int i=0;i<300;i+=3) check(Collections.frequency(out.subList(i,i+3),'H')==2,"group");
      try { new AlternatingPrinter(Integer.MAX_VALUE); throw new AssertionError("overflow bound"); }
      catch (IllegalArgumentException expected) {}
    `,
  },
  {
    chapter: '06-atomics-concurrent-collections.md', names: ['Stock', 'VersionedValue', 'AsyncRegistry'],
    test: `
      Object a=new Object(), b=new Object(); var v=new VersionedValue<Object>(a); var old=v.view();
      check(v.replace(old,b),"A to B"); check(v.replace(v.view(),a),"B to A");
      check(!v.replace(old,b),"stale stamp accepted");
      var root = new CompletableFuture<String>(); var r = new AsyncRegistry<String,String>();
      var first=r.getOrLoad("k",()->root); var second=r.getOrLoad("k",()->root);
      first.cancel(true); root.complete("ok"); check(second.join().equals("ok"),"shared cancellation");
      var stock=new Stock(10); AtomicInteger won=new AtomicInteger();
      try(var ex=Executors.newVirtualThreadPerTaskExecutor()) {
        var fs=java.util.stream.IntStream.range(0,100).mapToObj(i->ex.submit(()->{if(stock.tryReserve(1))won.incrementAndGet();})).toList();
        for(var f:fs)get(f);
      }
      check(won.get()==10 && stock.remaining()==0,"oversell");
    `,
  },
  {
    chapter: '07-executors-backpressure.md', names: ['ExecutorShutdown', 'BoundedWorkerService'],
    test: `
      var entered=new CountDownLatch(1); var hold=new CountDownLatch(1);
      try(var s=new BoundedWorkerService(1,1,Duration.ZERO)) {
        var running=s.submit(()->{entered.countDown(); hold.await(); return 1;});
        check(entered.await(2,TimeUnit.SECONDS),"worker entry");
        var queued=s.submit(()->2); s.forceShutdown();
        check(queued.isCancelled(),"drained future left pending"); fails(running);
      } finally {hold.countDown();}
      var ex=Executors.newSingleThreadExecutor();
      try { ExecutorShutdown.graceful(ex,Duration.ofNanos(-1)); throw new AssertionError("negative grace"); }
      catch(IllegalArgumentException expected) { check(!ex.isShutdown(),"validated after side effect"); }
      finally {ex.shutdownNow();}
    `,
  },
  {
    chapter: '10-concurrency-patterns.md',
    names: ['BoundedWorker', 'OneShotGate', 'ReadMostlyCatalog', 'RoutingTable', 'AccountActor', 'StripedCounter', 'SingleFlight', 'StartOnceService', 'PollingService', 'ParallelSum'],
    test: `
      try {new StripedCounter<String>(Integer.MIN_VALUE);throw new AssertionError("negative stripes");}
      catch(IllegalArgumentException expected){}
      var counter=new StripedCounter<String>(2);counter.add("k",Long.MAX_VALUE);
      try {counter.add("k",1);throw new AssertionError("counter overflow");}catch(ArithmeticException expected){}
      try(var polling=new PollingService(Thread::yield)) {
        try {polling.stop(Duration.ofNanos(-1));throw new AssertionError("negative stop");}catch(IllegalArgumentException expected){}
        check(!((AtomicBoolean)field(polling,"stopping")).get(),"invalid stop mutated state");
      }
      var catalog=new ReadMostlyCatalog(); catalog.put("a","b"); check(catalog.snapshot().size()==1,"snapshot");
      try {catalog.put("a",null);throw new AssertionError("null snapshot input");}catch(NullPointerException expected){}
      var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var s=new SingleFlight<String,String>();
      java.util.function.Function<String,String> loader=k->{entered.countDown();try{release.await();}catch(InterruptedException e){throw new RuntimeException(e);}return "ok";};
      var one=s.execute("k",loader);check(entered.await(2,TimeUnit.SECONDS),"loader entry");
      var two=s.execute("k",loader);one.cancel(true);release.countDown();check(two.get(2,TimeUnit.SECONDS).equals("ok"),"single flight cancellation");
      check(ParallelSum.sum(new long[]{1,2,3},2)==6,"sum");
    `,
  },
  {
    chapter: '11-classic-problems-solutions.md',
    names: ['Alternator', 'ZeroEvenOdd', 'ConcurrentFizzBuzz', 'H2O', 'DiningTable', 'BoundedQueue', 'WriterAwareRegister', 'ParallelMergeSort'],
    test: `
      var h=new H2O(); List<Character> output=Collections.synchronizedList(new ArrayList<>());
      try(var ex=Executors.newVirtualThreadPerTaskExecutor()) {
        List<Future<?>> fs=new ArrayList<>();
        for(int i=0;i<100;i++) {
          fs.add(ex.submit(()->{h.oxygen(()->output.add('O'));return null;}));
          for(int j=0;j<2;j++)fs.add(ex.submit(()->{h.hydrogen(()->output.add('H'));return null;}));
        }
        for(var f:fs)get(f);
      }
      check(output.size()==300,"H2O total");
      for(int i=0;i<300;i+=3)check(Collections.frequency(output.subList(i,i+3),'H')==2,"H2O group");
      var broken=new H2O(); var peers=new CountDownLatch(2);
      try(var ex=Executors.newVirtualThreadPerTaskExecutor()) {
        var a=ex.submit(()->{broken.hydrogen(peers::countDown);return null;});
        var b=ex.submit(()->{broken.hydrogen(peers::countDown);return null;});
        check(peers.await(2,TimeUnit.SECONDS),"hydrogens entered");
        var c=ex.submit(()->{Thread.currentThread().interrupt();broken.hydrogen(()->{});return null;});
        fails(c);fails(a);fails(b);
      }
      var reg=new WriterAwareRegister();var lock=(ReentrantLock)field(reg,"lock");
      var readers=(Condition)field(reg,"mayRead");var writers=(Condition)field(reg,"mayWrite");
      set(reg,"readers",1); // Hold one logical reader across the cancellation boundary.
      var writer=new FutureTask<Integer>(()->reg.write(()->42));Thread wt=new Thread(writer);wt.start();
      waitFor(()->{lock.lock();try{return lock.hasWaiters(writers);}finally{lock.unlock();}});
      var reader=new FutureTask<Integer>(reg::read);Thread rt=new Thread(reader);rt.start();
      waitFor(()->{lock.lock();try{return lock.hasWaiters(readers);}finally{lock.unlock();}});
      wt.interrupt();fails(writer);check(reader.get(2,TimeUnit.SECONDS)==0,"reader stranded by writer cancellation");
      wt.join();rt.join();
      int[] values=new SplittableRandom(42).ints(20000,-100,100).toArray();int[] expected=values.clone();Arrays.sort(expected);
      ParallelMergeSort.sort(values,4);check(Arrays.equals(values,expected),"parallel merge");
      var fizz=new ConcurrentFizzBuzz(Integer.MAX_VALUE);set(fizz,"current",(long)Integer.MAX_VALUE);
      AtomicInteger last=new AtomicInteger();fizz.number(last::set);check(last.get()==Integer.MAX_VALUE,"counter overflow");
    `,
  },
  {
    chapter: '12-lld-problems-solutions.md', names: ['TokenBucket', 'TtlCache', 'DagScheduler', 'EventBus', 'ConcurrentCrawler'],
    test: `
      var time=new AtomicLong();var bucket=new TokenBucket(1,1,time::get);
      Thread.currentThread().interrupt();
      try {bucket.acquire(Duration.ZERO);throw new AssertionError("zero wait ignored interrupt");}
      catch(InterruptedException expected){} finally {Thread.interrupted();}
      check(bucket.tryAcquire()&&!bucket.tryAcquire(),"bucket burst");time.set(1000000000L);check(bucket.tryAcquire(),"refill");
      var bus=new EventBus(Runnable::run);List<String> order=new ArrayList<>();
      java.util.function.Consumer<String> a=e->order.add("a");
      bus.subscribe(String.class,a);bus.subscribe(String.class,e->order.add("b"));var second=bus.subscribe(String.class,a);second.close();
      bus.publish("x").join();check(order.equals(List.of("a","b")),"removed equal but wrong registration");
      AtomicInteger dependent=new AtomicInteger(),independent=new AtomicInteger();
      var dag=new DagScheduler(List.of(new DagScheduler.Task("bad",Set.of(),()->{throw new IllegalStateException();}),
        new DagScheduler.Task("dep",Set.of("bad"),dependent::incrementAndGet),new DagScheduler.Task("ok",Set.of(),independent::incrementAndGet)),Runnable::run);
      fails(dag.run());check(dependent.get()==0&&independent.get()==1,"DAG failure scope");
      var entered=new CountDownLatch(1);var release=new CountDownLatch(1);var now=new AtomicLong();
      java.util.function.LongSupplier clock=()->{
        if(Thread.currentThread().getName().equals("ttl-reader")&&entered.getCount()>0){entered.countDown();try{release.await();}catch(InterruptedException e){throw new RuntimeException(e);}}
        return now.get();};
      try(var cache=new TtlCache<String,String>(clock)) {
        cache.put("k","old",Duration.ofNanos(5));var result=new FutureTask<Optional<String>>(() -> cache.get("k"));
        Thread reader=new Thread(result,"ttl-reader");reader.start();check(entered.await(2,TimeUnit.SECONDS),"TTL read cut");
        cache.put("k","new",Duration.ofNanos(100));now.set(10);release.countDown();
        check(result.get(2,TimeUnit.SECONDS).orElseThrow().equals("new"),"invented TTL miss");reader.join();
      }finally{release.countDown();}
      List<java.net.URI> visited=Collections.synchronizedList(new ArrayList<>());
      try(var crawler=new ConcurrentCrawler(2,uri->{visited.add(uri);return new ConcurrentCrawler.Page(uri,"",uri.getPath().equals("/")?
          List.of(java.net.URI.create("/a%2Fb"),java.net.URI.create("/a/b")):List.of());})) {
        check(crawler.crawl(java.net.URI.create("https://example.invalid/"),3,u->true).size()==3,"URI collision");
      }
      check(visited.stream().anyMatch(u->u.getRawPath().equals("/a%2Fb")),"escaped path changed");
    `,
  },
];

let classes = 0;
try {
  for (const [i, suite] of suites.entries()) {
    const dir = path.join(work, String(i)); fs.mkdirSync(dir);
    const text = fs.readFileSync(path.join(here, suite.chapter), 'utf8');
    const blocks = [...text.matchAll(/^```java\n([\s\S]*?)^```/gm)].map(m => m[1]);
    const files = [];
    for (const name of suite.names) {
      let block = name === 'JoinWithin'
        ? `final class JoinWithin {${blocks.find(b => b.includes('static boolean joinWithin('))}}`
        : blocks.find(b => new RegExp(`(?:class|interface|record) ${name}(?:[ <{(])`).test(b));
      if (!block) throw new Error(`missing ${name}`);
      if (suite.stubs?.[name]) block = block.replace(/}\s*$/, suite.stubs[name] + "\n}\n");
      const file = `${name}.java`; fs.writeFileSync(path.join(dir, file), imports + block); files.push(file);
    }
    fs.writeFileSync(path.join(dir, 'ReviewTest.java'), imports + `public class ReviewTest {${helpers} public static void main(String[] args) throws Exception {${suite.test}}}`);
    for (const [tool, args] of [['javac', ['--release', '21', ...files, 'ReviewTest.java']], ['java', ['-cp', dir, 'ReviewTest']]]) {
      const result = spawnSync(path.join(javaHome, 'bin', tool), args, { cwd: dir, encoding: 'utf8', timeout: 30000 });
      if (result.error || result.status !== 0) throw new Error(`${suite.chapter}: ${result.error?.message ?? result.stderr.slice(0, 2500)}`);
    }
    classes += suite.names.length;
    console.log(`PASS ${suite.chapter}: ${suite.names.length} extracted types and targeted regressions`);
  }
  console.log(`PASS ${suites.length} suites; ${classes} extracted top-level types; compile --release 21; runtime ${path.basename(javaHome)}`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

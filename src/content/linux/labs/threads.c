#include "common.h"
#include <pthread.h>

static pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
static int counter;
static void checked(int error, const char *what) {
    if (error) { fprintf(stderr, "%s: %s\n", what, strerror(error)); exit(EXIT_FAILURE); }
}
static void *worker(void *argument) {
    (void)argument;
    for (int i = 0; i < 1000; i++) {
        checked(pthread_mutex_lock(&lock), "lock"); counter++;
        checked(pthread_mutex_unlock(&lock), "unlock");
    }
    return NULL;
}
int main(void) {
    start_lab(); pthread_t workers[2];
    for (int i = 0; i < 2; i++) checked(pthread_create(&workers[i], NULL, worker, NULL), "create");
    for (int i = 0; i < 2; i++) checked(pthread_join(workers[i], NULL), "join");
    require(counter == 2000, "serialized increments");
    printf("counter=%d after both joins\n", counter);
    checked(pthread_mutex_destroy(&lock), "destroy"); return 0;
}

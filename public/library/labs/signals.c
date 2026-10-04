#include "common.h"
#include <signal.h>
#include <time.h>

int main(void) {
    start_lab();
    sigset_t set, old; require(sigemptyset(&set) == 0, "sigemptyset");
    require(sigaddset(&set, SIGUSR1) == 0, "sigaddset");
    require(sigprocmask(SIG_BLOCK, &set, &old) == 0, "block before generating");
    for (int i = 0; i < 3; i++) require(kill(getpid(), SIGUSR1) == 0, "self signal");
    struct timespec wait = { .tv_sec = 1, .tv_nsec = 0 };
    require(sigtimedwait(&set, NULL, &wait) == SIGUSR1, "accept pending signal");
    wait.tv_sec = 0; errno = 0;
    require(sigtimedwait(&set, NULL, &wait) == -1 && errno == EAGAIN, "no second pending instance");
    require(sigprocmask(SIG_SETMASK, &old, NULL) == 0, "restore mask after draining");
    puts("Three generated standard signals, one pending instance accepted.");
    return 0;
}

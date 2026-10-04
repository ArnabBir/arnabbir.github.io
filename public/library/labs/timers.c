#include "common.h"
#include <stdint.h>
#include <inttypes.h>
#include <sys/timerfd.h>

int main(void) {
    start_lab(); int fd = timerfd_create(CLOCK_MONOTONIC, TFD_CLOEXEC); require(fd >= 0, "timerfd_create");
    struct itimerspec spec = { .it_value = { .tv_sec = 0, .tv_nsec = 20000000 } };
    require(timerfd_settime(fd, 0, &spec, NULL) == 0, "arm one-shot timer");
    uint64_t expirations = 0;
    require(read_retry(fd, &expirations, sizeof expirations) == (ssize_t)sizeof expirations, "read expiration counter");
    require(expirations == 1, "one-shot count");
    printf("expirations=%" PRIu64 "; wake latency is not guaranteed\n", expirations);
    require(close(fd) == 0, "close timer"); return 0;
}

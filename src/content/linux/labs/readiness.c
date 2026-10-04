#include "common.h"
#include <fcntl.h>
#include <sys/epoll.h>

int main(void) {
    start_lab(); int ends[2]; require(pipe2(ends, O_NONBLOCK | O_CLOEXEC) == 0, "pipe2");
    int ep = epoll_create1(EPOLL_CLOEXEC); require(ep >= 0, "epoll_create1");
    struct epoll_event event = { .events = EPOLLIN | EPOLLET, .data.fd = ends[0] }, ready;
    require(epoll_ctl(ep, EPOLL_CTL_ADD, ends[0], &event) == 0, "register edge reader");
    write_all(ends[1], "ABCDEFGH", 8);
    require(epoll_wait(ep, &ready, 1, 1000) == 1, "initial readiness");
    char bytes[8]; require(read_retry(ends[0], bytes, 3) == 3, "partial drain");
    int events = epoll_wait(ep, &ready, 1, 0); require(events >= 0, "second poll");
    /* Do not require a fresh edge: notification behavior is not ownership. */
    require(read_retry(ends[0], bytes, sizeof bytes) == 5, "remaining bytes readable");
    errno = 0; require(read_retry(ends[0], bytes, sizeof bytes) == -1 && errno == EAGAIN, "drained to EAGAIN");
    printf("second poll=%d; five remaining bytes read; then EAGAIN\n", events);
    require(close(ep) == 0, "close epoll"); require(close(ends[0]) == 0, "close reader"); require(close(ends[1]) == 0, "close writer"); return 0;
}

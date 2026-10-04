#ifndef COMPANION_COMMON_H
#define COMPANION_COMMON_H
#define _GNU_SOURCE
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

/* Original companion helpers. Failures end this bounded process; the kernel
 * releases descriptors/mappings. Named files are unlinked immediately. */
static inline void require(int condition, const char *operation) {
    if (!condition) { fprintf(stderr, "%s: check failed (errno=%d: %s)\n", operation, errno, strerror(errno)); exit(EXIT_FAILURE); }
}
static inline void write_all(int fd, const void *buffer, size_t count) {
    const char *p = buffer;
    while (count) {
        ssize_t n = write(fd, p, count);
        if (n < 0 && errno == EINTR) continue;
        require(n > 0, "write progress"); p += n; count -= (size_t)n;
    }
}
static inline ssize_t read_retry(int fd, void *buffer, size_t count) {
    ssize_t n;
    do { n = read(fd, buffer, count); } while (n < 0 && errno == EINTR);
    return n;
}
static inline void read_exact(int fd, void *buffer, size_t count) {
    char *p = buffer;
    while (count) { ssize_t n = read_retry(fd, p, count); require(n > 0, "read progress"); p += n; count -= (size_t)n; }
}
static inline void start_lab(void) { alarm(4); }
#endif

#include "common.h"
#include <fcntl.h>

int main(void) {
    start_lab();
    char name[] = "/tmp/companion-fd-XXXXXX";
    int fd = mkstemp(name); require(fd >= 0, "mkstemp");
    require(unlink(name) == 0, "unlink private file");
    require(fcntl(fd, F_SETFD, FD_CLOEXEC) == 0, "set CLOEXEC");
    int alias = dup(fd); require(alias >= 0, "dup");
    int original_flags = fcntl(fd, F_GETFD), alias_flags = fcntl(alias, F_GETFD);
    require(original_flags >= 0 && alias_flags >= 0, "get descriptor flags");
    require((original_flags & FD_CLOEXEC) && !(alias_flags & FD_CLOEXEC), "descriptor-local flags");
    write_all(fd, "AB", 2); write_all(alias, "CD", 2);
    require(lseek(fd, 0, SEEK_CUR) == 4, "shared offset");
    require(lseek(alias, 0, SEEK_SET) == 0, "rewind shared offset");
    char bytes[5] = {0};
    require(read_retry(fd, bytes, 0) == 0, "zero-count read");
    read_exact(alias, bytes, 4); require(strcmp(bytes, "ABCD") == 0, "serialized bytes");
    printf("bytes=%s; original CLOEXEC=1; duplicate CLOEXEC=0\n", bytes);
    require(close(alias) == 0, "close alias"); require(close(fd) == 0, "close original");
    return 0;
}

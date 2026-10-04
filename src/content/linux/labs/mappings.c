#include "common.h"
#include <sys/mman.h>

int main(void) {
    start_lab(); char name[] = "/tmp/companion-map-XXXXXX";
    int fd = mkstemp(name); require(fd >= 0, "mkstemp"); require(unlink(name) == 0, "unlink");
    write_all(fd, "AB", 2);
    char *private = mmap(NULL, 2, PROT_READ | PROT_WRITE, MAP_PRIVATE, fd, 0);
    require(private != MAP_FAILED, "mmap private"); private[0] = 'Z';
    char original = 0; require(pread(fd, &original, 1, 0) == 1, "pread backing file");
    require(private[0] == 'Z' && original == 'A', "private change is not file write");
    puts("private mapping starts Z; backing file still starts A.");
    require(munmap(private, 2) == 0, "munmap"); require(close(fd) == 0, "close"); return 0;
}

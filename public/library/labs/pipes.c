#include "common.h"
#include <fcntl.h>

int main(void) {
    start_lab(); int ends[2]; require(pipe(ends) == 0, "pipe");
    int flags = fcntl(ends[0], F_GETFL); require(flags >= 0, "get flags");
    require(fcntl(ends[0], F_SETFL, flags | O_NONBLOCK) == 0, "nonblocking read");
    char bytes[4] = {0}; errno = 0;
    require(read_retry(ends[0], bytes, 1) == -1 && errno == EAGAIN, "empty with live writer");
    write_all(ends[1], "XYZ", 3); require(close(ends[1]) == 0, "close final writer");
    read_exact(ends[0], bytes, 3); require(strcmp(bytes, "XYZ") == 0, "buffer drains first");
    require(read_retry(ends[0], bytes, 1) == 0, "positive-size read EOF");
    puts("EAGAIN while writer exists; XYZ drains after close; then EOF.");
    require(close(ends[0]) == 0, "close reader"); return 0;
}

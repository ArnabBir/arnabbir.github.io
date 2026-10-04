#include "common.h"
#include <sys/socket.h>

int main(void) {
    start_lab(); int peers[2];
    require(socketpair(AF_UNIX, SOCK_STREAM, 0, peers) == 0, "socketpair");
    write_all(peers[0], "ABCDEF", 6);
    require(shutdown(peers[0], SHUT_WR) == 0, "half-close write direction");
    char bytes[7] = {0}; read_exact(peers[1], bytes, 6);
    require(strcmp(bytes, "ABCDEF") == 0, "drained payload");
    require(read_retry(peers[1], bytes, 1) == 0, "receive EOF");
    write_all(peers[1], "OK", 2); read_exact(peers[0], bytes, 2);
    require(memcmp(bytes, "OK", 2) == 0, "reverse direction remains usable");
    puts("Six bytes before EOF; reverse reply OK after half-close.");
    require(close(peers[0]) == 0, "close peer 0"); require(close(peers[1]) == 0, "close peer 1"); return 0;
}

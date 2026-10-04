#include "common.h"
#include <fcntl.h>
#include <termios.h>
#include <poll.h>

int main(void) {
    start_lab(); int master = posix_openpt(O_RDWR | O_NOCTTY); require(master >= 0, "posix_openpt");
    require(grantpt(master) == 0 && unlockpt(master) == 0, "prepare private slave");
    char *name = ptsname(master); require(name != NULL, "ptsname");
    int slave = open(name, O_RDWR | O_NOCTTY); require(slave >= 0, "open slave");
    struct termios config; require(tcgetattr(slave, &config) == 0, "tcgetattr");
    config.c_lflag |= ICANON; config.c_lflag &= ~ECHO;
    require(tcsetattr(slave, TCSANOW, &config) == 0, "canonical without echo");
    write_all(master, "abc", 3);
    struct pollfd probe = { .fd = slave, .events = POLLIN };
    require(poll(&probe, 1, 20) == 0, "incomplete canonical line is not readable");
    write_all(master, "\n", 1);
    require(poll(&probe, 1, 1000) == 1 && (probe.revents & POLLIN), "completed line ready");
    char line[4]; read_exact(slave, line, sizeof line); require(memcmp(line, "abc\n", 4) == 0, "canonical line");
    puts("abc held until newline; slave received four bytes.");
    require(close(slave) == 0, "close slave"); require(close(master) == 0, "close master"); return 0;
}

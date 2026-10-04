#include "common.h"
#include <sys/wait.h>

int main(void) {
    start_lab();
    int local = 7;
    pid_t child = fork(); require(child >= 0, "fork");
    if (child == 0) { local = 9; _exit(local); }
    int status; pid_t result;
    do { result = waitpid(child, &status, 0); } while (result < 0 && errno == EINTR);
    require(result == child, "waitpid");
    require(WIFEXITED(status) && WEXITSTATUS(status) == 9, "decode child status");
    require(local == 7, "private ordinary memory");
    printf("parent local=%d; child exit=%d; child reaped\n", local, WEXITSTATUS(status));
    return 0;
}

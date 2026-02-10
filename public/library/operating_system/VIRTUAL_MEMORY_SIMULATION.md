Virtual Memory Simulator

This is a comprehensive, single-page React application designed to visualize the complex interactions of a Virtual Memory management system. It simulates the flow of a memory request from the CPU through the MMU, utilizing a TLB, Page Table, Physical RAM, and Disk storage.

Features

1. Hardware Simulation

CPU / MMU: Generates 12-bit virtual addresses (6-bit VPN, 6-bit Offset).

TLB (Translation Lookaside Buffer): A fully associative cache with 4 entries using an LRU (Least Recently Used) replacement policy (visualized by the bottom entry being the victim).

Page Table: A mapped structure in main memory supporting 64 virtual pages, tracking Valid bits and Physical Frame Numbers (PFN).

Physical Memory (RAM): 8 physical frames.

Disk (Swap Space): Acts as the backing store for pages evicted from RAM.

2. Algorithmic Visualization

TLB Lookup: Demonstrates Hit vs. Miss logic.

Page Fault Handling: Visualizes the penalty path when a page is not in RAM (accessing Disk, finding a free frame, updating Page Table).

Eviction: When RAM is full, the simulator randomly selects a victim frame to evict (simulating a basic replacement policy for visual clarity), invalidates the old Page Table entry, and loads the new page.

3. Interactive Controls

Step Once: Manually trigger a single memory request.

Auto Play: Runs the simulation in a loop to observe behavior over time.

Reset: Clears all caches and memory to the initial state.

Implementation Details

State Management: The app uses React's useState to maintain the complex state of hardware components.

Animation Queue: To ensure the user can follow the fast-paced logic of a CPU, the simulation creates a "Processing Queue" of steps. A useEffect loop consumes this queue with delays, updating the UI to highlight the currently active component (CPU -> TLB -> RAM, etc.).

Styling: Built with Tailwind CSS for a responsive, dark-mode, cyberpunk-inspired aesthetic.

Icons: Uses lucide-react for crisp, scalable UI elements.

How to Use

Open the file in a browser or preview environment.

Click "Step Once" to generate a single random virtual address request.

Watch the highlight (Blue border/Glow) move from the CPU to the TLB.

Green: Indicates a Hit or successful access.

Red: Indicates a Miss or Page Fault.

Orange: Indicates Disk I/O activity.

Observe the System Log at the bottom for a text-based breakdown of events.
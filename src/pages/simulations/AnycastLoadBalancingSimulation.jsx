'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "anycast-load-balancing",
  "title": "Anycast as a Load Balancing feature",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Networking • Global Load Balancing",
  "accent": "emerald",
  "heroIcon": "Globe",
  "paper": {
    "filename": "Anycast as a Load Balancing feature.pdf"
  },
  "abstract": "Our IT organization is made up of many sub-teams, each providing a service such as DNS, LDAP , HTTP proxy, and so on. Each one is deployed globally, using their own replication mechanisms. Our team provides Load Balancing and failover services in a way that other teams can use without having to manage the underlying technology. We recently added Anycast as a service we offer to other teams that need to be able to failover between Load Balancers. While Anycast is complex and mysterious to many systems administrators, our architecture provides the service in a way that the other teams do not need to worry about the details. They simply provide the service behind Load Balancers they currently use, with an additional virtual IP address. This paper describes how Anycast works, it's benefits, and the architecture we used to provide Anycast failover as a service. Introduction The most natural way to think about Load Balancing, is to put as many service replicas as required in your server room, and have a Load Balancer distribute the load amongst them. To increase reliability, Load Balancers are usually deployed in High Availability pairs, and we assume this to be the case throughout this paper. A regular Load Balancing scenario would look like Drawing 1. The above is already an improvement in reliability, but it can go further. Imagine a disaster scenario where the users are still active and requesting the service and so is the Load Balancer, but all the backends for a specific service are not. This solution in itself wouldn’t solve the problem (see: Drawing 2). A better design would automatically redirect all those clients to another location (or server room), making the process as transparent as possible. A way to accomplish this is to identify the nearest secondary location, and configure the Load Balancer to proxy or redirect all the user requests there, until the local service is re-established. Most load balancing products offer automatic redirection as depicted in the right (see: Drawing 3). But what if the Load Balancers are also not available? (see: Drawing 4) How can we guarantee that the users will be able to reach another instance of the service? How can that be accomplished in the least intrusive way? Drawing 1: Regular Load Balancing Scenario Drawing 2: Failure mode There are many ways to solve this problem, depending on the specifics of each implementation. One possibility would be to update DNS records for the services, so users can now reach the service in a different location. Potentially, this DNS update can be automated but there has to be a mechanism to check service status in other locations and keep track of their state so the system knows where to send users in case of a failure. Considering that services are sometimes deployed in hundreds of locations, it would not be effective to have a central place collecting all the information about services, so the DNS update mechanism would need to be distributed to as many locations as the service is deployed. We consider this a non optimal solution, since there is the possibility to integrate the monitoring and automatic failover in the existing Load Balancing infrastructure. DNS TTL can also be a burden. Sometimes it is not possible to use very small TTLs and the time it takes to propagate DNS changes would still be downtime from the users’ perspective. Once your system is back, there is again the need to update DNS entries to point users back to the original location. Basics of Anycast Anycast is a network routing technique where many hosts have the exact same IP address. Clients trying to reach that IP address are routed to the nearest host. If these duplicate hosts all provide the same service, the clients simply receive the service from the host topologically nearest. Anycast per se doesn’t have information on service specific health status, which might result in requests being sent to locations which do not have a healthy instance of the service running. It is then necessary to think about service specific healthchecks. If a given service has about 200 different instances, managing healthchecks and the Border Gateway Protocol 4 (BGP) configuration for each of those instances can be very complicated. Our implementation We use Anycast for failover between Load Balancing clusters, providing the benefits of Anycast to any service behind our Load Balancers. This reduces a lot the network environment complexity, given the reduced number of machines advertising routes. Our solution uses BGP because it allows creation of a hierarchy for the route advertising, but other protocols work as well. Using Anycast, there is no longer need for remote failover using proxies, providing a cleaner solution since the client connects directly to the failover location, whilst proxying usually makes you lose the client identifying information. It also saves the proxy overhead between servers and users. Drawing 3: Remote failover Drawing 4: Remote failover - failure mode",
  "diagram": {
    "nodes": [
      {
        "id": "client",
        "label": "Client",
        "icon": "Monitor",
        "hint": "Sends request to VIP"
      },
      {
        "id": "bgp",
        "label": "Anycast / BGP",
        "icon": "Globe",
        "hint": "Same IP announced from many sites"
      },
      {
        "id": "pop",
        "label": "Edge PoP / LB",
        "icon": "Server",
        "hint": "Receives traffic at nearest site"
      },
      {
        "id": "health",
        "label": "Health + Routing",
        "icon": "Activity",
        "hint": "Withdraw/adjust announcements"
      },
      {
        "id": "backend",
        "label": "Backend Service",
        "icon": "Database",
        "hint": "Serves application traffic"
      }
    ],
    "flow": [
      "client",
      "bgp",
      "pop",
      "backend"
    ]
  },
  "steps": [
    {
      "title": "Announce the VIP",
      "description": "Multiple sites advertise the same anycast IP prefix into routing.",
      "active": [
        "bgp",
        "pop"
      ],
      "log": "Anycast prefix advertised from many PoPs.",
      "message": {
        "from": "Anycast / BGP",
        "to": "Edge PoP / LB",
        "label": "BGP announce"
      }
    },
    {
      "title": "Client sends to VIP",
      "description": "Client connects to the anycast virtual IP (VIP).",
      "active": [
        "client",
        "bgp"
      ],
      "log": "Client connects to VIP.",
      "message": {
        "from": "Client",
        "to": "Anycast / BGP",
        "label": "SYN → VIP"
      }
    },
    {
      "title": "Route to 'nearest' PoP",
      "description": "BGP policy/metrics steer traffic to a closest/acceptable PoP.",
      "active": [
        "bgp",
        "pop"
      ],
      "log": "Traffic lands at nearest healthy PoP.",
      "message": {
        "from": "Anycast / BGP",
        "to": "Edge PoP / LB",
        "label": "Route selection"
      }
    },
    {
      "title": "Load balancer forwards",
      "description": "PoP load balancer selects a backend and forwards the request.",
      "active": [
        "pop",
        "backend"
      ],
      "log": "LB forwards request to backend.",
      "message": {
        "from": "Edge PoP / LB",
        "to": "Backend Service",
        "label": "LB → backend"
      }
    },
    {
      "title": "PoP failure / withdrawal",
      "description": "If a PoP fails health checks, it withdraws routes or is drained.",
      "active": [
        "health",
        "bgp"
      ],
      "log": "Unhealthy PoP removed from routing.",
      "message": {
        "from": "Health + Routing",
        "to": "Anycast / BGP",
        "label": "Withdraw route"
      }
    },
    {
      "title": "Converge & fail over",
      "description": "Traffic shifts to another PoP after routing convergence.",
      "active": [
        "bgp",
        "pop"
      ],
      "log": "Traffic fails over to another site.",
      "message": {
        "from": "Anycast / BGP",
        "to": "Edge PoP / LB",
        "label": "Convergence"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "What this simulation shows",
        "icon": "Info",
        "bullets": [
          "How **anycast** uses standard Internet routing (BGP) for load balancing and failover.",
          "Why health-based route withdrawal is critical: routing is blind to application health.",
          "Operational reality: failover depends on **convergence time** and routing policy."
        ]
      },
      {
        "title": "Where anycast fits",
        "icon": "Layers",
        "bullets": [
          "Common for global DNS, CDNs, edge proxies, and L4 load balancing.",
          "Pairs well with per-site L7 balancing for finer-grained distribution."
        ]
      },
      {
        "title": "Failure modes to design for",
        "icon": "AlertTriangle",
        "bullets": [
          "Slow convergence can cause transient loss or overload elsewhere.",
          "Route flaps or partial reachability can create uneven traffic distribution.",
          "Hot spots: popular prefixes can attract more traffic than expected."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Anycast",
        "def": "One IP advertised from multiple locations; routing delivers to one location."
      },
      {
        "term": "BGP",
        "def": "Border Gateway Protocol; controls inter-domain routing on the Internet."
      },
      {
        "term": "VIP",
        "def": "Virtual IP address that represents a service endpoint."
      },
      {
        "term": "Convergence",
        "def": "Time it takes routing to settle after a change/failure."
      },
      {
        "term": "Route withdrawal",
        "def": "Removing an advertisement so traffic no longer flows to that site."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function AnycastLoadBalancingSimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}

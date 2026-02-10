'use client';

import React from "react";
import PaperSimulationScaffold from "./_shared/PaperSimulationScaffold";

const CONFIG = {
  "id": "google-search-anatomy",
  "title": "The Anatomy of a Large-Scale Hypertextual Web Search Engine",
  "subtitle": "Interactive simulation + deep dive",
  "badge": "Search • Indexing & Ranking",
  "accent": "indigo",
  "heroIcon": "Search",
  "paper": {
    "filename": "The Anatomy of a Large-Scale Hypertextual Web Search Engine.pdf"
  },
  "abstract": "In this paper, we present Google, a prototype of a large-scale search engine which makes heavy use of the structure present in hypertext. Google is designed to crawl and index the Web efficiently and produce much more satisfying search results than existing systems. The prototype with a full text and hyperlink database of at least 24 million pages is available at http://google.stanford.edu/ To engineer a search engine is a challenging task. Search engines index tens to hundreds of millions of web pages involving a comparable number of distinct terms. They answer tens of millions of queries every day. Despite the importance of large-scale search engines on the web, very little academic research has been done on them. Furthermore, due to rapid advance in technology and web proliferation, creating a web search engine today is very different from three years ago. This paper provides an in-depth description of our large-scale web search engine -- the first such detailed public description we know of to date. Apart from the problems of scaling traditional search techniques to data of this magnitude, there are new technical challenges involved with using the additional information present in hypertext to produce better search results. This paper addresses this question of how to build a practical large-scale system which can exploit the additional information present in hypertext. Also we look at the problem of how to effectively deal with uncontrolled hypertext collections where anyone can publish anything they want. Keywords World Wide Web, Search Engines, Information Retrieval, PageRank, Google 1. Introduction (Note: There are two versions of this paper -- a longer full version and a shorter printed version. The full version is available on the web and the conference CD-ROM.) The web creates new challenges for information retrieval. The amount of information on the web is growing rapidly, as well as the number of new users inexperienced in the art of web research. People are likely to surf the web using its link graph, often starting with high quality human maintained indices such as Yahoo! or with search engines. Human maintained lists cover popular topics effectively but are subjective, expensive to build and maintain, slow to improve, and cannot cover all esoteric topics. Automated search engines that rely on keyword matching usually return too many low quality matches. To make matters worse, some advertisers attempt to gain people’s attention by taking measures meant to mislead automated search engines. We have built a large-scale search engine which addresses many of the problems of existing systems. It makes especially heavy use of the additional structure present in hypertext to provide much higher quality search results. We chose our system name, Google, because it is a common spelling of googol, or 10 100 and fits well with our goal of building very large-scale search engines. 1.1 Web Search Engines -- Scaling Up: 1994 - 2000 Search engine technology has had to scale dramatically to keep up with the growth of the web. In 1994, one of the first web search engines, the World Wide Web Worm (WWWW) [McBryan 94] had an index of 110,000 web pages and web accessible documents. As of November, 1997, the top search engines claim to index from 2 million (WebCrawler) to 100 million web documents (from Search Engine Watch). It is foreseeable that by the year 2000, a comprehensive index of the Web will contain over a billion documents. At the same time, the number of queries search engines handle has grown incredibly too. In March and April 1994, the World Wide Web Worm received an average of about 1500 queries per day. In November 1997, Altavista claimed it handled roughly 20 million queries per day. With the increasing number of users on the web, and automated systems which query search engines, it is likely that top search engines will handle hundreds of millions of queries per day by the year 2000. The goal of our system is to address many of the problems, both in quality and scalability, introduced by scaling search engine technology to such extraordinary numbers. 1.2. Google: Scaling with the Web Creating a search engine which scales even to today’s web presents many challenges. Fast crawling technology is needed to gather the web documents and keep them up to date. Storage space must be used efficiently to store indices and, optionally, the documents themselves. The indexing system must process hundreds of gigabytes of data efficiently. Queries must be handled quickly, at a rate of hundreds to thousands per second. These tasks are becoming increasingly difficult as the Web grows. However, hardware performance and cost have improved dramatically to partially offset the difficulty. There are, however, several notable exceptions to this progress such as disk seek time and operating system robustness. In designing Google, we have considered both the rate of growth of the Web and technological changes. Google is designed to scale well to extremely large data sets. It makes efficient use of storage space to store the index. Its data structures are optimized for fast and efficient access (see section 4.2). Further, we expect that the cost to index and store text or HTML will eventually decline relative to the amount that will be available (see Appendix B). This will result in favorable scaling properties for centralized systems like Google. 1.3 Design Goals 1.3.1 Improved Search Quality Our main goal is to improve the quality of web search engines. In 1994, some people believed that a complete search index would make it possible to find anything easily. According to Best of the Web 1994 -- Navigators, \"The best navigation service should make it easy to find almost anything on the Web (once all the data is entered).\" However, the Web of 1997 is quite different. Anyone who has used a search engine recently, can readily testify that the completeness of the index is not the only factor in the quality of search results. \"Junk results\" often wash out any results that a user is interested in. In fact, as of November 1997, only one of the top four commercial search engines finds itself (returns its own search page in response to its name in the top ten results). One of the main causes of this problem is that the number of documents in the indices has been increasing by many orders of magnitude, but the user’s ability to look at documents has not. People are still only willing to look at the first few tens of results.",
  "diagram": {
    "nodes": [
      {
        "id": "crawler",
        "label": "Crawler",
        "icon": "Globe",
        "hint": "Fetches pages"
      },
      {
        "id": "indexer",
        "label": "Indexer",
        "icon": "Layers",
        "hint": "Parses + builds index"
      },
      {
        "id": "pagerank",
        "label": "PageRank",
        "icon": "GitBranch",
        "hint": "Link analysis signals"
      },
      {
        "id": "serving",
        "label": "Query Serving",
        "icon": "Server",
        "hint": "Answers user queries"
      },
      {
        "id": "results",
        "label": "Results",
        "icon": "Monitor",
        "hint": "Ranked output"
      }
    ],
    "flow": [
      "crawler",
      "indexer",
      "pagerank",
      "serving",
      "results"
    ]
  },
  "steps": [
    {
      "title": "Crawl the web",
      "description": "Fetch pages, follow links, and keep the corpus fresh.",
      "active": [
        "crawler"
      ],
      "log": "Pages crawled.",
      "message": {
        "from": "Crawler",
        "to": "Indexer",
        "label": "Crawl"
      }
    },
    {
      "title": "Parse & extract signals",
      "description": "Extract text, links, anchor text, and metadata.",
      "active": [
        "indexer",
        "crawler"
      ],
      "log": "Signals extracted for indexing.",
      "message": {
        "from": "Indexer",
        "to": "Crawler",
        "label": "Parse"
      }
    },
    {
      "title": "Build inverted index",
      "description": "Map terms to posting lists of documents (docids).",
      "active": [
        "indexer"
      ],
      "log": "Inverted index built.",
      "message": {
        "from": "Indexer",
        "to": "PageRank",
        "label": "Index"
      }
    },
    {
      "title": "Compute link-based rank",
      "description": "Compute PageRank-like importance from the link graph.",
      "active": [
        "pagerank"
      ],
      "log": "Global rank signals computed.",
      "message": {
        "from": "PageRank",
        "to": "Query Serving",
        "label": "PageRank"
      }
    },
    {
      "title": "Serve user query",
      "description": "Lookup postings, intersect/score documents, and rank results.",
      "active": [
        "serving"
      ],
      "log": "Query executed across index.",
      "message": {
        "from": "Query Serving",
        "to": "Results",
        "label": "Serve"
      }
    },
    {
      "title": "Return ranked results",
      "description": "Combine scores/signals and return results quickly.",
      "active": [
        "results",
        "serving"
      ],
      "log": "Ranked results returned.",
      "message": {
        "from": "Results",
        "to": "Query Serving",
        "label": "Results"
      }
    }
  ],
  "deepDive": {
    "sections": [
      {
        "title": "Core pipeline",
        "icon": "Info",
        "bullets": [
          "Crawling → indexing → ranking signals → query serving.",
          "The inverted index enables fast term lookup; ranking combines many signals."
        ]
      },
      {
        "title": "Key ideas from early web search",
        "icon": "Layers",
        "bullets": [
          "Use link structure (PageRank) as a quality signal.",
          "Exploit anchor text and link context for better relevance.",
          "Separate offline computation (indexing/rank) from online serving."
        ]
      },
      {
        "title": "System constraints",
        "icon": "AlertTriangle",
        "bullets": [
          "Freshness vs coverage: crawl scheduling is as important as ranking.",
          "Serving must be highly parallel and fault-tolerant."
        ]
      }
    ],
    "glossary": [
      {
        "term": "Inverted index",
        "def": "Term → list of documents containing the term."
      },
      {
        "term": "Posting list",
        "def": "The list of docIDs (and possibly positions) for a term."
      },
      {
        "term": "PageRank",
        "def": "Link-analysis algorithm assigning importance scores to pages."
      },
      {
        "term": "Anchor text",
        "def": "Clickable text of a link; useful relevance signal."
      },
      {
        "term": "DocID",
        "def": "Internal identifier for a document in the index."
      }
    ]
  },
  "autoPlayMs": 1400
};

export default function GoogleSearchAnatomySimulation() {
  return <PaperSimulationScaffold config={CONFIG} />;
}

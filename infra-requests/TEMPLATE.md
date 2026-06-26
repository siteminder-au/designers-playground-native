---
id: YYYY-MM-DD-{designer}-{short-slug}
designer: {designer-slug}
prototype: {prototype-slug}
title: {one-line summary of the request}
status: open            # open | needs-info | applied | declined
created: YYYY-MM-DD
github_issue:           # URL, filled in once the issue is created
affected_infra:         # designer's best guess — the owner confirms the real list
  - server.js
---

## What I need

<!-- Plain-language description of the capability. Describe the behaviour and interface
     you need, NOT the implementation. e.g. "a way to store and fetch orders for my
     prototype" rather than the actual SQL/GraphQL resolver code. -->

## Why

<!-- What this unblocks. e.g. "persisting bookings so they survive an app reload." -->

## Desired behaviour / interface

<!-- Be concrete about the contract, still without writing the implementation:
     - GraphQL queries/mutations you'd call (name + rough shape)
     - sample request and response payloads
     - data you need stored (field names + rough types)
     - any screen registration, nav entry, or URL linking needed
     This helps the owner implement exactly what you need. -->

## Acceptance / how I'll verify

<!-- How you'll know it works once shipped. e.g. "my prototype can create an order and
     reload it after restarting the app." -->

## Owner log

<!-- Maintained by Pat's Claude during /review-infra-requests. Decisions, questions,
     what was implemented, version bump, commit SHA. Designers: do not edit. -->

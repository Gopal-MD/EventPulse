# Lightweight Validation Test Cases

1. QR Generation Test
- Input: name and email submitted to ticket generator
- Expected: ticketId is generated with TKT- prefix and assigned gate

2. QR Duplicate Scan Test
- Input: scan same ticket twice
- Expected: first scan passes, second scan is blocked as duplicate

3. Crowd Alert Trigger Test
- Input: crowdLevel above threshold for any gate
- Expected: alert list is created with reroute suggestion

4. Gate Assignment Logic Test
- Input: attendee names from A-Z
- Expected: gates assigned by alphabetical split (A-F, G-L, M-R, S-Z)

# UserTrace — OSINT Username Recon Tool

A live username reconnaissance tool that scans 25+ platforms 
to map a target's digital footprint.

## Live Demo
[Try it here](https://shadowstrikers.github.io/usertrace)

## What it does
Enter any username and UserTrace checks for active accounts 
across 25 platforms in real time — including GitHub, Reddit, 
Twitter, Instagram, Steam, HackTheBox, TryHackMe, and more.

Results show:
- Which platforms the username was found on (with direct links)
- Which platforms returned no match
- An overall exposure score based on platform coverage

## How it works
Each platform URL is checked via a CORS proxy using a HEAD 
request. A 200/301/302 response is treated as a confirmed 
account. Results populate in real time as each check completes.

## Privacy
No data is stored, logged, or transmitted anywhere. All checks 
run client-side in the browser.

## Limitations
Some platforms block automated HEAD requests or return 
inconsistent status codes, which may produce false positives 
or unreachable results. This is a known limitation of 
browser-based OSINT tools.

## Built with
HTML, CSS, JavaScript

## Inspired by
[Sherlock](https://github.com/sherlock-project/sherlock) — 
the open source Python username OSINT tool

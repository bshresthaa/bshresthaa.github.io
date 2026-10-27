'use strict';

const HOME = '/home/biraj';
const HOST = 'kernel-lab';
const THEMES = ['amber', 'lab', 'paper'];
const WRITE_CMDS = new Set(['rm', 'mv', 'mkdir', 'touch', 'cp', 'chmod', 'chown']);

const session = {
  user: 'biraj',
  cwd: HOME,
  prev: HOME,
  open: null,
  history: [],
  histIndex: 0,
  told: false,
};

const expanded = new Set(['/', '/home', HOME, HOME + '/projects']);
let simGen = 0;
let bootTimers = [];
let clockOn = false;

function dir(blurb, children) {
  return { type: 'dir', blurb, children };
}

function file(blurb, body, extra) {
  const text = body
    .replace(/^\n/, '')
    .replace(/\{c\}([\s\S]*?)\{\/c\}/g, '`$1`')
    .replace(/\s+$/, '\n');
  return Object.assign({ type: 'file', format: 'prose', blurb, body: text }, extra || {});
}

const root = dir('bsh', {
  etc: dir('Small configuration. Hostname, release, the message at login.', {
    hostname: file('This machine\'s name.', 'kernel-lab\n', { format: 'plain' }),
    'os-release': file('What bsh claims to be.', `
NAME="bsh"
VERSION="0.4.2 (youngstown)"
ID=bsh
PRETTY_NAME="bsh 0.4.2 — beneath the abstraction"
HOME_URL="https://bshresthaa.github.io/"
`, { format: 'plain' }),
    motd: file('Said once, at login. You can read it again.', `
# Message of the day

bsh 0.4.2 (youngstown)

This system belongs to Biraj Shrestha.
It is small on purpose.

Four worker threads. One home directory.
The work is in the files.
`),
  }),
  home: dir('Users.', {
    biraj: dir('The only home that matters here.', {
      README: file('Start here. It is short on purpose.', `
# Biraj Shrestha

Systems, backend, and the layer people usually skip.

Youngstown State University. B.S. Computer Science, mathematics minor, 3.72.
Software engineer at CloudRx. Youngstown, Ohio.

I didn't get into this to assemble libraries and hope the abstractions hold.
I wanted to know what the machine is doing when the code runs.
The descriptor. The lock. The page. The query plan.

This is a small system you can actually use.
The tree on the left is the filesystem. The line at the bottom is a shell.

Try {c}ls{/c}, then {c}cd projects{/c}, then {c}cat http-server{/c}.
Or ignore the shell and click. Both paths hit the same files.

{c}cat{/c} prints the source of a file. The pane above renders it.
That split is the whole idea.

{c}help{/c} if you would rather not guess.

The work lives in [projects](~/projects), [work](~/work), [infra](~/infra), and [notes](~/notes).
The addresses are in [contact](~/contact).
`),
      about: file('Why the low-level work and the day job are the same curiosity.', `
# Behind the code

The interesting failures are rarely in the framework.
They are in a lock that should have been a condition variable,
a query that read the whole table, a socket read that returned
fewer bytes than the header promised, a process nobody restarted.

So the work I practice lives there.

An HTTP server on POSIX sockets, because I wanted the handshake
and the file descriptor, not a class named Server.

An ext2 walker, because a filesystem is a layout you can read
if you are willing to do the arithmetic.

An LRU sized in bytes, not in "number of items," because capacity
is memory, and memory is finite.

And the day job: healthcare software at CloudRx, where a silent
failure is not a philosophical problem. Prescriptions, integrations,
and the queries under them have to be right.

> The low-level work is not a hobby I keep separate from production.
> It is how I debug production.

I want to keep going at systems, infrastructure, and backends.
High-throughput where it has to be, and boringly correct where a person is waiting.

## School

Youngstown State University
B.S. Computer Science, mathematics minor
GPA 3.72 / 4.0
Systems, operating systems, algorithms, concurrency
`),
      resume: file('The record, in a form a person can read.', `
# Résumé

Biraj Shrestha
Youngstown, Ohio · open to remote
biraj30stha@gmail.com
github.com/bshresthaa
linkedin.com/in/biraj-shrestha

Systems, backend, and infrastructure.
C++17 where the abstraction is the thing being studied.
PHP, MySQL, and AWS where a person is waiting on the system.

## Now

Software engineer, CloudRx.
Healthcare platforms and clinical workflows.

- REST integrations for clinical providers: retries, validation, audit logs that still make sense tomorrow.
- MySQL: {c}EXPLAIN{/c}, composite indexes, fewer N+1 waterfalls.
- Background jobs for sync and reports, so the page a clinician is looking at stays fast.
- Production diagnosis from logs. Fixes that do not take the system down.
- Clinician-facing UI in JavaScript, jQuery, and Bootstrap. The stack is whatever the clinic already runs.
- Legacy PHP, pulled into smaller pieces when a change has to touch it. Not a rewrite for the sake of a diagram.

## Systems

Multithreaded C++ HTTP server.
POSIX sockets, a fixed pool of four workers, a mutex and a condition variable, response framing that sets Content-Length. The source is public.

ext2 exploration utility.
Superblock, inode tables, indirect pointers, directory entries. No mount. The disk image is the API. The parser is implemented. The repository is not public yet.

LRU file cache.
An unordered map and a list, eviction by byte budget, attention paid to reader-writer locks. Implemented and benchmarked. Not public yet.

## Infrastructure

AWS: EC2, VPC, security groups, IAM, CloudWatch logs and alarms.
systemd units for the things I run myself.
Git, GitHub Actions, the ordinary pipeline that catches the build before a machine does.

## School

Youngstown State University.
B.S. Computer Science, mathematics minor, 3.72 GPA.

## Stack

C++17, POSIX, PHP, MySQL, JavaScript.
AWS EC2, CloudWatch, VPC, systemd, Git.

A PDF lives at [resume.pdf](resume.pdf), for a person who does not want to {c}cat{/c} this.
If the PDF is missing, you are already looking at the résumé.
`),
      skills: file('What I actually use, grouped honestly.', `
# Skills

## Systems

C++17. POSIX sockets. Threads, mutexes, condition variables.
ext2: inodes, bitmaps, indirect blocks.
Memory layout, pointers, Linux syscalls.

## Backend

PHP. MySQL, {c}EXPLAIN{/c}, indexes.
REST, retries, audit logs.
Background jobs. Data integrity, treated as the job and not the footnote.

## Infrastructure

EC2, VPC, security groups, IAM.
CloudWatch logs and alarms.
systemd. Git and GitHub Actions. Linux, as an administrator of small machines, not as a sticker.

## The other surface

JavaScript. HTML and CSS, written by hand.
jQuery and Bootstrap, because that is what the clinic ships.
Accessible tables and forms, because the person using them is busy.

## Applied, carefully

Retrieval-augmented generation. Semantic chunking. Schema checks on the way out.
Shell automation. Make and clang++.
The model drafts. I still read the diff.
`),
      projects: dir('Systems work. The part I don\'t want abstracted away.', {
        'http-server': file('POSIX sockets, four workers, no framework in the way.', `
# Multithreaded C++ HTTP server

status: public · C++17 · POSIX sockets

I implemented this from the calls, not from a framework:
{c}socket(PF_INET, SOCK_STREAM, 0){/c}, then {c}bind{/c}, {c}listen{/c}, and {c}accept{/c}.
The point was the TCP handshake, the descriptor, and what an HTTP
response actually has to contain before a client will stop waiting.

The trace below is one request. Send it.

A thread per connection is the obvious design and the wrong one.
Each thread costs a stack, and under load the scheduler spends its time switching.
The server keeps a fixed pool of four workers and a queue.

- The main thread accepts and enqueues descriptors.
- Workers sleep on a {c}std::condition_variable{/c} instead of spinning.
- Shutdown is a flag under the same mutex, then {c}notify_all{/c} and a join.
- The response sets {c}Content-Length{/c} and writes the body. Promised bytes have to arrive.

~~~
socket(PF_INET, SOCK_STREAM, 0)
bind, listen, accept

queue.push(fd)
cond.notify_one()

unique_lock lock(mu);
cond.wait(lock, [&] { return stop || !queue.empty(); });
~~~

Still open, and written down so they stay open:

- Parse headers without trusting the request line alone.
- Refuse paths that try to leave the document root.
- Time the pool against an epoll or kqueue loop and record the difference, not the vibe.

Source is public. From the shell: {c}open server{/c}.
There is a longer draft in [sockets](~/notes/sockets) and [the pool](~/notes/thread-pool).
`, { widget: 'pool', widgetAfter: 4 }),
        ext2: file('Read a filesystem by doing the arithmetic.', `
# ext2 filesystem exploration utility

status: core parser implemented · source not public yet

An inspector for unmounted ext2 disk images. It does not ask the kernel
to mount anything. It reads the bytes and does the layout itself.

- Superblock: magic {c}0xEF53{/c}, block size {c}1024 << s_log_block_size{/c}, inode counts, free-block bitmaps.
- Inodes: mode, owner, size, twelve direct pointers, then single, double, and triple indirect.
- Directories: variable-length {c}ext2_dir_entry_2{/c} records, walked by hand to resolve a path.

The interesting part is the arithmetic. An inode number is not an address.
It is an index you translate into a block group, then a table, then a slot.

The primary superblock sits at offset 1024. Everything else is a consequence of that.

A longer draft: [ext2 on disk](~/notes/ext2-on-disk).
`),
        'lru-cache': file('O(1) lookup. Evicted by bytes, not by wishful counting.', `
# LRU file cache

status: implemented and benchmarked · source not public yet

An in-memory cache meant to sit in front of disk reads.
Lookup and eviction are both O(1), and the budget is bytes.

- {c}std::unordered_map{/c} for the key. The value is an iterator into a {c}std::list{/c} of blocks, so a hit moves a block to the front without a scan.
- Eviction tracks the byte footprint, not the entry count. A few large files should not be able to blow the budget just because the count looked small.
- I looked at a shared mutex so readers do not serialize behind each other. A single global lock is simpler and, under a read-heavy load, the wrong simple.

The design is ordinary on purpose. The mistakes in an LRU are usually in the accounting.
`),
      }),
      work: dir('Production. Healthcare, so it has to fail loudly.', {
        cloudrx: file('Integrations, queries, jobs, and the logs when they break.', `
# CloudRx

status: software engineer · healthcare platforms

Healthcare software does not get to fail quietly. I work on the backend
behind clinical workflows: PHP, MySQL, JavaScript, REST, and the AWS
machines they run on.

## Integrations

REST clients for clinical and pharmacy providers. The interesting part
is not the happy path. It is the retry, the backoff, the payload check,
and an audit log that still makes sense the next day.

## MySQL

Slow queries, read with {c}EXPLAIN{/c}. Composite indexes where a filter
actually deserves one. N+1 waterfalls removed instead of papered over.
Schema changes treated as production changes, because they are.

## Jobs

Prescription syncs and report generation do not belong inside the request
a clinician is waiting on. That work moved to background workers and
scheduled jobs. The page stays quick because the slow part left it.

## Production

When something breaks, the log comes first. Reproduce the bad row,
fix it, ship it without taking the system down, and do not get curious
about patient data the bug does not require. Confidentiality is part of
the design, not a footer.

## The interface

Clinician-facing screens in JavaScript, jQuery, Bootstrap, and CSS.
Tables that scan. Forms that refuse a bad value before the server has to.
The stack is not fashionable. The person using it is busy.

## The older code

Legacy PHP, pulled into smaller pieces when a change has to touch it.
A function with a name, a boundary, and a test when the boundary is one
I do not trust.

The machines under this are in [infra/aws](~/infra/aws).
`),
      }),
      infra: dir('A program is not finished on localhost.', {
        aws: file('EC2, the network around it, and alarms that fire first.', `
# AWS, observed

status: production infrastructure

Code is not done when it runs on localhost. I work in the AWS account
where the healthcare apps actually run.

- EC2 for the hosts.
- VPC subnets and security groups that are narrow on purpose. 80 and 443, and SSH that is not a gift to the internet.
- IAM that can do the job and not the adjacent jobs.
- CloudWatch log groups, and alarms for CPU, disk, and HTTP 5xx, so the graph notices before a clinic does.

The list below is the path a request takes.
Click a node if you want the reason it is there.

A longer, unfinished note: [deploying a small service](~/notes/aws-deploy).
`, {
          widget: 'topology',
          widgetAfter: 5,
          topo: [
            { name: 'client', text: 'A browser, usually a clinician. Sometimes me, with curl, asking the server what it actually sent.' },
            { name: 'dns / tls / proxy', text: 'The name has to resolve, the certificate has to be real, and the proxy has to forward to a process that is listening. None of that is the application, and all of it is the outage.' },
            { name: 'ec2, linux', text: 'A hardened host. Security groups open 80 and 443, and SSH only through a path I can name. systemd restarts what dies. If the unit file is sloppy, the restart is sloppy too.' },
            { name: 'workers', text: 'The slow work. Syncs and reports leave the request a person is waiting on. A queue is a product decision as much as a technical one.' },
            { name: 'mysql', text: 'Indexed, or it is not finished. EXPLAIN is the tool. A missing index shows up as a clinic waiting on a spinner.' },
            { name: 'cloudwatch', text: 'Logs in one place. Alarms on CPU, disk, and 5xx. The point of the alarm is that it fires before someone has to tell you.' },
          ],
        }),
        lab: file('systemd, the pool, and the pipeline that catches me.', `
# The lab beside the job

The C++ services are not a slide. I run them on Linux.

That means a systemd unit, not a terminal I have to keep open.
A socket that binds where I said it would. Supervision that restarts
the process if I wrote a bug worthy of a restart. Concurrency tried
across a real network, not only localhost, because the delay changes
which bugs you meet.

The pipeline is ordinary and I want it that way.
Git, GitHub Actions, a compile, tests, and a linter before anything
is allowed to call itself deployed. Clang in the toolchain.
curl when I want to see what the server actually answered.

- systemd units, written as configuration and not as folklore
- POSIX daemons and the sockets they own
- GitHub Actions for the compile and the tests
- clang, and curl used as a question
`),
      }),
      notes: dir('Drafts. Written to find out whether I actually understand it.', {
        sockets: file('Descriptors, partial reads, and Content-Length.', `
# Building an HTTP server from raw sockets

status: draft · systems · C++

A socket call returns an integer. That integer is a file descriptor.
Everything after that is reading and writing a file that happens to be the network.

The part I keep having to relearn in my hands:

- {c}htons{/c}, because the port is a number and the wire has an opinion about byte order.
- {c}SO_REUSEADDR{/c}, because {c}TIME_WAIT{/c} will otherwise sit on the port after I kill the server for the tenth time.
- A read can return half a request. TCP does not know what an HTTP message is. The application has to.
- {c}Content-Length{/c} has to be right. A client will wait forever for bytes you promised and did not send.

The server in [projects/http-server](~/projects/http-server) is the lab this note is about.
The note is behind the code. That is the usual order, and the wrong one. I am trying to reverse it.
`),
        'thread-pool': file('Why four threads beat a thread per connection.', `
# Why a thread pool beats a thread per connection

status: draft · concurrency

Creating a thread is not free. On Linux the default stack reservation is large,
and a connection storm turns into a scheduler problem before it turns into a throughput win.
Detaching a thread per client also makes shutdown a rumor. You cannot join what you let go of.

A fixed pool bounds the damage. Four workers, a queue, a mutex, a condition variable.

- Workers sleep in {c}wait{/c} until the predicate is true. The predicate is there because wakeups can be wrong.
- The main thread does not do the request. It accepts, enqueues, notifies one waiter, and goes back.
- Shutdown sets a flag under the lock and calls {c}notify_all{/c}. Then it joins. The queue drains or it doesn't, and I want that choice to be explicit.

The interesting number is not the size of the pool. It is whether the threads are asleep when there is no work.
A pool that spins is just a busy-wait with extra steps.

See [the server](~/projects/http-server). From the shell, {c}sim{/c} walks one request through it.
`),
        'ext2-on-disk': file('Superblock at 1024. Then the pointers.', `
# Exploring ext2 on raw disk

status: draft · filesystems

The primary superblock is at byte 1024. The magic is {c}0xEF53{/c}.
If that isn't there, you are not looking at ext2, and no amount of pointer-chasing will save you.

From the superblock you learn the block size and how the disk is cut into groups.
An inode number becomes a group index and an offset in that group's inode table.
That translation is the whole utility. Get it wrong and every later pointer is confident nonsense.

- Twelve direct block pointers cover the small files.
- A single indirect block covers the next tier.
- Double and triple indirect are there for the files that are larger than you wanted to think about.
- Directory entries are variable length. You walk them with the record length, not with a fixed stride.

Nothing here is mounted. The kernel's idea of the filesystem is exactly what this exercise refuses to use.

The program is [projects/ext2](~/projects/ext2).
`),
        'slow-queries': file('EXPLAIN, indexes, and the N+1 I have met in person.', `
# Debugging a slow database-backed endpoint

status: draft · MySQL

The endpoint was fine in the demo and wrong in the clinic.
The first tool is {c}EXPLAIN{/c}, read before anyone adds a cache.

- {c}type: ALL{/c} means the plan gave up and read the table. {c}type: ref{/c} means an index was allowed to help.
- A filesort on a hot path is a smell, not a personality.
- Composite index order follows the query: equality columns first, then the range, and not the other way around because the column felt important.
- N+1 in PHP is usually a loop that looks innocent. One query for the list, then one per row for a name that should have been joined.

Transactions and row locks show up when two clinical updates must land together or not at all.
The lock is not the slow part. The missing index under the lock is.

This is the same instinct as the socket work. Find the boundary the abstraction hid, and measure there.
`),
        'aws-deploy': file('From a unit file to an alarm.', `
# Deploying a small service on AWS

status: draft · infrastructure

Localhost is a compliment the program pays itself. The deployment is the rest of the sentence.

- A systemd unit with a working directory, a user that is not root, and a restart policy you have actually watched fire.
- The CloudWatch agent tailing the log file you really write, not the one you meant to write.
- An alarm on 5xx, and one on disk, because a full disk looks like a mysterious application bug for longer than it should.
- A deploy script that can go backward. A rollout you cannot reverse is a hope.

Security groups are part of the program. An open SSH port is not a convenience. It is a decision you should have to remake on purpose.

Related: [infra/aws](~/infra/aws) and [infra/lab](~/infra/lab).
`),
      }),
      tooling: dir('Tools, including the statistical ones, on a short leash.', {
        rag: file('Retrieval, for when the model should read before it speaks.', `
# RAG, without the fog machine

status: notes · applied

I am interested in retrieval-augmented generation as a systems problem.
Chunk the documents so a passage can stand on its own. Embed them.
Rank them. Put the winners in the prompt. Check the model's output
against a schema before anything downstream trusts it.

The failure mode I care about is a fluent answer that never touched the code.
Grounding is the point. A vector index that returns the wrong file with confidence
is worse than an empty result, because the empty result admits it doesn't know.

- Chunking that respects functions and headings, not just a token ruler.
- A budget for how much context you are willing to spend.
- A validator on the way out, so a malformed answer dies before a person does.
`),
        automation: file('Scripts that remove the boring mistakes.', `
# Workflow automation

The scripts I keep are the ones that fail in a way I can read.

- Test runners that stop the push when the suite is red.
- Log parsers that cluster the repeated error instead of making me scroll past it.
- Git hooks for formatting, so the review is about the change and not the whitespace.
- Small CLIs that scaffold a fixture I would otherwise rebuild by hand and rebuild wrong.

A script that hides its output is not automation. It is a new outage with fewer logs.
`),
        review: file('The model drafts. I still read the diff.', `
# Augmented, then read

I use current coding tools as a fast pair for exploration: edge cases I had not listed,
a first draft of a note, a walk through a file I do not know yet.

The rule is dull and I keep it anyway.
The model proposes. I check the boundary conditions, the security assumptions,
and whether the abstraction matches the bytes. A generated test that asserts
the bug is not a test. A generated explanation that I cannot rederive is not understanding.

Speed is useful. Unreviewed speed is how a clinic gets a bad deploy.
`),
      }),
      contact: file('Addresses. I answer mail.', `
# Contact

I answer mail. I am open to systems and backend roles. Remote is fine.

**Email**
biraj30stha@gmail.com

**GitHub**
github.com/bshresthaa

**LinkedIn**
linkedin.com/in/biraj-shrestha

**Where**
Youngstown, Ohio

From the shell: {c}open email{/c}, {c}open github{/c}, {c}open linkedin{/c}, {c}open server{/c}.
`, {
        links: [
          { label: 'email', href: 'mailto:biraj30stha@gmail.com' },
          { label: 'github', href: 'https://github.com/bshresthaa' },
          { label: 'linkedin', href: 'https://www.linkedin.com/in/biraj-shrestha-9b7215258/' },
          { label: 'http server source', href: 'https://github.com/bshresthaa/multithreaded-http-server' },
          { label: 'résumé pdf', href: 'resume.pdf' },
        ],
      }),
      '.plan': file('What is unfinished, written down so it stays unfinished on purpose.', `
# .plan

On the HTTP server, still:

- Parse headers without trusting the request line alone.
- Refuse paths that try to leave the document root.
- Time the pool against an epoll or kqueue loop and write down the difference.

On the notes:

- They stay drafts until the examples are honest.

The amber is intentional. {c}theme{/c} will change it if you disagree.
Paper is a desk. Lab is the night shift. Amber stays the default
because it is closer to the machines I actually like.
`),
      '.profile': file('The shell\'s few opinions.', `
# ~/.profile

export EDITOR=less
export SHELL=/bin/bsh
export POOL=4

# The pool sleeps. It does not spin.
`, { format: 'plain' }),
    }),
  }),
  proc: dir('A few truths the system will admit if you ask.', {
    engineer: file('The summary an older terminal on this site used to print.', `
name:         Biraj Shrestha
education:    B.S. Computer Science, mathematics minor
institution:  Youngstown State University
gpa:          3.72
location:     Youngstown, Ohio
work:         Software engineer, CloudRx
drive:        what the machine is actually doing
`, { format: 'plain' }),
  }),
});

const EXTERNAL = {
  github: 'https://github.com/bshresthaa',
  gh: 'https://github.com/bshresthaa',
  linkedin: 'https://www.linkedin.com/in/biraj-shrestha-9b7215258/',
  li: 'https://www.linkedin.com/in/biraj-shrestha-9b7215258/',
  email: 'mailto:biraj30stha@gmail.com',
  mail: 'mailto:biraj30stha@gmail.com',
  server: 'https://github.com/bshresthaa/multithreaded-http-server',
  pdf: 'resume.pdf',
  'resume.pdf': 'resume.pdf',
};

const MANUAL = {
  ls: 'List names. ls -l is the long form. ls -a includes dotfiles. An optional path lists somewhere else.',
  cd: 'Change directory. With no argument, go home. cd - returns to the previous directory.',
  pwd: 'Print the working directory.',
  cat: 'Print a file raw, the way it is stored. The pane above renders Markdown. Directories are not files.',
  open: 'Open a file in the reader, or a known place: email, github, linkedin, server, resume.pdf. less is the same command.',
  less: 'Alias of open. This system has a reader, not a second pager.',
  head: 'Print the first lines of a file. head -n 20 file.',
  grep: 'Search file contents under the working directory. grep <text> [path]. Quotes keep a phrase together.',
  find: 'List paths under here. find <text> keeps the ones whose path or blurb matches.',
  tree: 'Draw the directories. tree -a includes dotfiles.',
  wc: 'Lines, words, and bytes for a file.',
  echo: 'Print arguments. $USER, $HOME, $HOST, $PWD, $SHELL, $EDITOR, $POOL expand.',
  whoami: 'Print the user you logged in as.',
  id: 'Print the user and the groups this system bothers to invent.',
  uname: 'Print the system name. uname -a is the longer version.',
  hostname: 'Print kernel-lab.',
  uptime: 'How long this session has been up.',
  date: 'The clock on the machine you are actually using.',
  ps: 'A short process list. Some of the processes are the point.',
  motd: 'Print /etc/motd again.',
  theme: 'theme [amber|lab|paper]. Amber is the default. Paper is a desk. Lab is the night shift.',
  history: 'Commands from this login.',
  clear: 'Clear the scrollback. Ctrl-L does this too.',
  sim: 'Open the HTTP server and trace one request through the pool.',
  fetch: 'A short description of the machine, without the ASCII mascot.',
  help: 'This list.',
  man: 'man <command> prints one paragraph. man alone prints help.',
  make: 'There is nothing to build in the shell. The server was built where the compiler lives.',
  logout: 'End the session and return to the login.',
  exit: 'Same as logout. Ctrl-D on an empty line does it too.',
  sudo: 'You are not in the sudoers file.',
  vim: 'Not installed. If you name a file, it opens in the reader anyway.',
};

const HELP_GROUPS = [
  ['go', [
    ['ls', 'list names'],
    ['cd', 'change directory'],
    ['pwd', 'where you are'],
    ['tree', 'draw the tree'],
    ['find', 'search names'],
  ]],
  ['read', [
    ['cat', 'print the source'],
    ['open', 'render a file, or a link'],
    ['head', 'first lines'],
    ['grep', 'search inside files'],
    ['wc', 'lines, words, bytes'],
  ]],
  ['the machine', [
    ['whoami', 'the login'],
    ['uname', 'bsh 0.4.2'],
    ['ps', 'what is running'],
    ['fetch', 'a short portrait'],
    ['uptime', 'this session'],
    ['motd', 'the login note'],
  ]],
  ['session', [
    ['theme', 'amber, lab, paper'],
    ['sim', 'trace one request'],
    ['help', 'this list'],
    ['clear', 'wipe the scrollback'],
    ['logout', 'lock the screen'],
  ]],
];

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function join(dirPath, name) {
  return dirPath === '/' ? '/' + name : dirPath + '/' + name;
}

function parent(path) {
  if (!path || path === '/') return '/';
  const i = path.lastIndexOf('/');
  return path.slice(0, i) || '/';
}

function resolvePath(cwd, input) {
  let p = input == null ? cwd : String(input);
  if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
  else if (!p.startsWith('/')) p = (cwd === '/' ? '' : cwd) + '/' + p;
  const parts = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return '/' + parts.join('/');
}

function nodeAt(path) {
  const norm = resolvePath('/', path && path.startsWith('/') ? path : '/' + (path || ''));
  if (norm === '/') return root;
  let n = root;
  for (const part of norm.split('/').filter(Boolean)) {
    if (!n || n.type !== 'dir' || !n.children[part]) return null;
    n = n.children[part];
  }
  return n;
}

function displayPath(path) {
  if (path === HOME) return '~';
  if (path.startsWith(HOME + '/')) return '~' + path.slice(HOME.length);
  return path || '/';
}

function shellArg(from, target) {
  if (target === from) return '.';
  const prefix = from === '/' ? '/' : from + '/';
  if (target.startsWith(prefix)) return target.slice(prefix.length);
  return target;
}

function tokenize(line) {
  const out = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      else cur += c;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (/\s/.test(c)) {
      if (cur) { out.push(cur); cur = ''; }
    } else {
      cur += c;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function byteSize(text) {
  return new TextEncoder().encode(text || '').length;
}

function humanSize(n) {
  if (n < 1024) return n + ' B';
  return (n / 1024).toFixed(1) + ' K';
}

function inlineFormat(escaped) {
  return escaped
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
      if (/^(https?:|mailto:)/i.test(url) || url.endsWith('.pdf')) {
        const external = url.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener noreferrer"';
        return `<a href="${url}"${external}>${label}</a>`;
      }
      return `<button type="button" class="as-link" data-cmd="open ${url}">${label}</button>`;
    })
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderMarkdown(src) {
  const fences = [];
  const text = String(src).replace(/~~~([\s\S]*?)~~~/g, (_, code) => {
    const clean = code.replace(/^\n/, '').replace(/\n$/, '');
    const i = fences.push(clean) - 1;
    return `%%FENCE${i}%%`;
  });
  const blocks = text.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  const html = blocks.map((block) => {
    const fence = block.trim().match(/^%%FENCE(\d+)%%$/);
    if (fence) {
      return `<pre class="code"><code>${escapeHtml(fences[Number(fence[1])])}</code></pre>`;
    }
    const lines = block.split('\n');
    if (lines.length === 1 && lines[0].startsWith('# ')) {
      return `<h1>${inlineFormat(escapeHtml(lines[0].slice(2)))}</h1>`;
    }
    if (lines.length === 1 && lines[0].startsWith('## ')) {
      return `<h2>${inlineFormat(escapeHtml(lines[0].slice(3)))}</h2>`;
    }
    if (lines.length === 1 && /^status:/i.test(lines[0])) {
      return `<p class="kicker">${inlineFormat(escapeHtml(lines[0]))}</p>`;
    }
    if (lines.every((l) => l.startsWith('> '))) {
      return `<blockquote>${lines.map((l) => inlineFormat(escapeHtml(l.slice(2)))).join('<br>')}</blockquote>`;
    }
    if (lines.every((l) => l.startsWith('- '))) {
      return `<ul>${lines.map((l) => `<li>${inlineFormat(escapeHtml(l.slice(2)))}</li>`).join('')}</ul>`;
    }
    return `<p>${inlineFormat(escapeHtml(block)).replace(/\n/g, '<br>')}</p>`;
  }).join('');
  return `<article class="prose">${html}</article>`;
}

function collectFiles(path, out = []) {
  const n = nodeAt(path);
  if (!n) return out;
  if (n.type === 'file') { out.push(path); return out; }
  for (const name of Object.keys(n.children)) collectFiles(join(path, name), out);
  return out;
}

function collectNodes(path, out = []) {
  const n = nodeAt(path);
  if (!n) return out;
  out.push(path);
  if (n.type === 'dir') {
    for (const name of Object.keys(n.children)) collectNodes(join(path, name), out);
  }
  return out;
}

function search(pattern, start) {
  const needle = pattern.toLowerCase();
  const hits = [];
  for (const path of collectFiles(start)) {
    const lines = nodeAt(path).body.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(needle)) {
        hits.push({ path, line: i + 1, text: lines[i].trim() });
        if (hits.length >= 50) return hits;
      }
    }
  }
  return hits;
}

function envVars() {
  return {
    USER: session.user,
    HOME,
    HOST,
    HOSTNAME: HOST,
    SHELL: '/bin/bsh',
    EDITOR: 'less',
    PATH: '/bin',
    PWD: session.cwd,
    POOL: '4',
  };
}

function expandVars(s) {
  const vars = envVars();
  return s.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, a, b) => {
    const key = a || b;
    return Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : '';
  });
}

function uptimeString() {
  const started = session.startedAt || Date.now();
  const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const clock = hours ? `${hours}h ${minutes % 60}m` : minutes ? `${minutes}m` : `${seconds}s`;
  return `up ${clock},  1 user,  load average: 0.02, 0.04, 0.01`;
}

function promptHtml() {
  const who = session.user === 'guest' ? 'guest' : 'user';
  return `<span class="ps1"><span class="${who}">${escapeHtml(session.user)}</span><span class="at">@</span><span class="host">${HOST}</span><span class="colon">:</span><span class="path">${escapeHtml(displayPath(session.cwd))}</span><span class="sigil">$</span> </span>`;
}

function cmdButton(label, cmd, type) {
  const cls = type === 'dir' ? 'as-text dir' : 'as-text';
  return `<button type="button" class="${cls}" data-cmd="${escapeHtml(cmd)}">${escapeHtml(label)}</button>`;
}

function reveal(path) {
  expanded.add('/');
  const parts = path.split('/').filter(Boolean);
  let acc = '';
  for (const part of parts) {
    acc += '/' + part;
    const n = nodeAt(acc);
    if (n && n.type === 'dir') expanded.add(acc);
  }
}

function viewBar(prog, path, node) {
  let meta;
  if (node.type === 'dir') meta = Object.keys(node.children).length + ' entries';
  else meta = (node.format === 'plain' ? 'raw' : 'rendered') + ' · ' + humanSize(byteSize(node.body));
  return `<header class="view-bar"><span class="prog">${prog}</span><span class="view-path">${escapeHtml(path)}</span><span class="view-meta">${meta}</span></header>`;
}

function poolHtml() {
  const workers = [0, 1, 2, 3].map((i) => (
    `<div class="worker" data-worker="${i}"><strong>worker ${i}</strong><em>waiting</em></div>`
  )).join('');
  const steps = ['accept', 'enqueue', 'notify', 'read', 'send']
    .map((name) => `<span class="step">${name}</span>`).join('');
  return `<section class="widget" id="sim">
    <div class="widget-kicker">thread pool · one request</div>
    <div class="workers">${workers}</div>
    <div class="steps">${steps}</div>
    <p class="sim-log">Idle. The workers are asleep, which is the correct state.</p>
    <button type="button" class="text-btn" id="sim-btn">send GET /</button>
  </section>`;
}

function topoHtml(node) {
  const buttons = node.topo.map((item, i) => (
    `<button type="button" data-i="${i}" class="${i === 2 ? 'on' : ''}">${escapeHtml(item.name)}</button>`
  )).join('');
  return `<section class="widget" id="topo">
    <div class="widget-kicker">request path</div>
    <div class="topo">${buttons}</div>
    <p class="topo-detail">${escapeHtml(node.topo[2].text)}</p>
  </section>`;
}

function linksHtml(links) {
  const anchors = links.map((l) => {
    const ext = l.href.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener noreferrer"';
    return `<a href="${escapeHtml(l.href)}"${ext}>${escapeHtml(l.label)}</a>`;
  }).join('');
  return `<div class="actions">${anchors}<button type="button" class="ghost" data-copy="biraj30stha@gmail.com">copy email</button></div>`;
}

function widgetHtml(node) {
  if (node.widget === 'pool') return poolHtml();
  if (node.widget === 'topology') return topoHtml(node);
  if (node.links) return linksHtml(node.links);
  return '';
}

function composeDocument(node) {
  if (node.format === 'plain') {
    return `<pre class="code file-raw"><code>${escapeHtml(node.body)}</code></pre>`;
  }
  const widget = widgetHtml(node);
  if (!widget || !node.widgetAfter) return renderMarkdown(node.body) + widget;
  const parts = node.body.trim().split(/\n\s*\n/);
  const before = parts.slice(0, node.widgetAfter).join('\n\n');
  const rest = parts.slice(node.widgetAfter).join('\n\n');
  return renderMarkdown(before) + widget + (rest.trim() ? renderMarkdown(rest) : '');
}

function renderFile(path) {
  const node = nodeAt(path);
  session.open = path;
  const viewer = document.getElementById('viewer');
  viewer.innerHTML = viewBar('less', path, node) + `<div class="view-body">${composeDocument(node)}</div>`;
  const sim = document.getElementById('sim');
  if (sim) sim.querySelector('#sim-btn').addEventListener('click', () => runSim(sim));
  const topo = document.getElementById('topo');
  if (topo) {
    topo.addEventListener('click', (e) => {
      const button = e.target.closest('[data-i]');
      if (!button) return;
      topo.querySelectorAll('button').forEach((el) => el.classList.toggle('on', el === button));
      topo.querySelector('.topo-detail').textContent = node.topo[Number(button.dataset.i)].text;
    });
  }
}

function renderDir(path) {
  const node = nodeAt(path);
  session.open = path;
  const rows = Object.entries(node.children).map(([name, child]) => {
    const childPath = join(path, name);
    const hidden = name.startsWith('.') ? ' is-hidden' : '';
    const kind = child.type === 'dir' ? 'dir' : 'file';
    return `<button type="button" class="entry ${kind}${hidden}" data-go="${escapeHtml(childPath)}">
      <span class="entry-name">${escapeHtml(name)}${child.type === 'dir' ? '/' : ''}</span>
      <span class="entry-blurb">${escapeHtml(child.blurb || '')}</span>
    </button>`;
  }).join('');
  document.getElementById('viewer').innerHTML = viewBar('ls', path, node)
    + `<div class="view-body"><div class="listing">${rows}</div></div>`;
}

function renderBranch(path, node) {
  return Object.entries(node.children).map(([name, child]) => {
    const childPath = join(path, name);
    const isDir = child.type === 'dir';
    const open = session.open === childPath ? ' open' : '';
    const cwd = isDir && session.cwd === childPath ? ' cwd' : '';
    const hidden = name.startsWith('.') ? ' hidden-file' : '';
    const isExp = expanded.has(childPath);
    const twist = isDir
      ? `<button type="button" class="twist" data-twist="${escapeHtml(childPath)}" aria-expanded="${isExp ? 'true' : 'false'}" aria-label="${isExp ? 'Collapse' : 'Expand'} ${escapeHtml(name)}">${isExp ? '▾' : '▸'}</button>`
      : '<span class="twist-spacer"></span>';
    const kids = isDir && isExp ? `<div class="branch">${renderBranch(childPath, child)}</div>` : '';
    return `<div class="node ${isDir ? 'dir' : 'file'}${open}${cwd}${hidden}">
      <div class="node-row">${twist}<button type="button" class="node-btn" data-go="${escapeHtml(childPath)}" title="${escapeHtml(child.blurb || '')}">${escapeHtml(name)}${isDir ? '/' : ''}</button></div>
      ${kids}
    </div>`;
  }).join('');
}

function renderTree() {
  const tree = document.getElementById('tree');
  if (!tree) return;
  tree.innerHTML = `<div class="tree-label"><span>fs</span><span class="tree-cwd">${escapeHtml(displayPath(session.cwd))}</span></div>`
    + renderBranch('/', root);
}

function renderCrumbs() {
  const path = session.open || session.cwd;
  const el = document.getElementById('crumbs');
  if (!el) return;
  const pieces = [];
  const push = (label, target, current) => {
    pieces.push(`<button type="button" class="crumb${current ? ' current' : ''}" data-go="${escapeHtml(target)}">${escapeHtml(label)}</button>`);
  };
  if (path === HOME || path.startsWith(HOME + '/')) {
    push('~', HOME, path === HOME);
    let acc = HOME;
    const rest = path.slice(HOME.length).split('/').filter(Boolean);
    rest.forEach((part, i) => {
      acc += '/' + part;
      pieces.push('<span class="sep">/</span>');
      push(part, acc, i === rest.length - 1);
    });
  } else {
    push('/', '/', path === '/');
    let acc = '';
    const parts = path.split('/').filter(Boolean);
    parts.forEach((part, i) => {
      acc += '/' + part;
      pieces.push('<span class="sep">/</span>');
      push(part, acc, i === parts.length - 1);
    });
  }
  el.innerHTML = pieces.join('');
}

function refreshChrome() {
  const ps1 = document.getElementById('ps1');
  if (ps1) ps1.innerHTML = promptHtml();
  renderCrumbs();
  renderTree();
  const shown = session.open || session.cwd;
  const name = shown.split('/').filter(Boolean).pop() || 'bsh';
  document.title = `${name} — ${session.user}@${HOST}`;
  const next = '#' + shown;
  if (location.hash !== next) history.replaceState(null, '', next);
}

function scrollTerm() {
  const el = document.getElementById('scrollback');
  if (el) el.scrollTop = el.scrollHeight;
}

function trimScroll() {
  const el = document.getElementById('scrollback');
  while (el && el.children.length > 300) el.firstChild.remove();
}

function append(className, text, html) {
  const el = document.getElementById('scrollback');
  if (!el) return;
  const div = document.createElement('div');
  div.className = className;
  if (html) div.innerHTML = html;
  else div.textContent = text;
  el.appendChild(div);
  trimScroll();
  scrollTerm();
}

function print(text) { append('out', text, null); }
function printErr(text) { append('out err', text, null); }
function printDim(text) { append('out dim', text, null); }
function printHtml(html) { append('block', null, html); }

function echoLine(text) {
  printHtml(`<div class="echo">${promptHtml()}<span class="typed">${escapeHtml(text)}</span></div>`);
}

function setPane(name) {
  document.body.dataset.pane = name;
  document.querySelectorAll('.tabs button').forEach((button) => {
    const on = button.dataset.pane === name;
    button.classList.toggle('on', on);
    button.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function isWide() {
  return window.matchMedia('(min-width: 801px)').matches;
}

function place(path) {
  const node = nodeAt(path);
  if (!node) return false;
  if (node.type === 'dir') {
    session.cwd = path;
    session.prev = path;
    renderDir(path);
    reveal(path);
  } else {
    session.cwd = parent(path);
    session.prev = session.cwd;
    renderFile(path);
    reveal(session.cwd);
  }
  return true;
}

function visit(path, from) {
  const node = nodeAt(path);
  if (!node) {
    printErr(`bsh: ${path}: No such file or directory`);
    return;
  }
  const arg = shellArg(session.cwd, path);
  if (node.type === 'dir') {
    echoLine('cd ' + arg);
    session.history.push('cd ' + arg);
    session.histIndex = session.history.length;
    session.prev = session.cwd;
    session.cwd = path;
    renderDir(path);
    reveal(path);
    if (from === 'tree') {
      expanded.add(path);
      setPane('files');
    }
  } else {
    echoLine('cat ' + arg);
    session.history.push('cat ' + arg);
    session.histIndex = session.history.length;
    renderFile(path);
    reveal(parent(path));
    printDim('opened in less.');
    setPane('page');
  }
  refreshChrome();
}

function goHome() {
  echoLine('cd ~');
  session.history.push('cd ~');
  session.histIndex = session.history.length;
  session.prev = session.cwd;
  session.cwd = HOME;
  renderFile(HOME + '/README');
  reveal(HOME);
  setPane('page');
  refreshChrome();
}

function longRow(path, node, name) {
  const label = (name || path.split('/').pop()) + (node.type === 'dir' ? '/' : '');
  const size = node.type === 'dir' ? '    —' : String(byteSize(node.body)).padStart(5, ' ');
  const mode = node.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--';
  const cmd = (node.type === 'dir' ? 'cd ' : 'cat ') + path;
  return `<div class="ls-row"><span class="mode">${mode}</span><span>biraj</span><span class="size">${size}</span>${cmdButton(label, cmd, node.type)}</div>`;
}

function cmdLs(args) {
  const flags = args.filter((a) => a.startsWith('-')).join('');
  let paths = args.filter((a) => !a.startsWith('-'));
  if (!paths.length) paths = ['.'];
  const showAll = flags.includes('a');
  const long = flags.includes('l');
  paths.forEach((p, index) => {
    const path = resolvePath(session.cwd, p);
    const node = nodeAt(path);
    if (!node) { printErr(`bsh: ls: cannot access '${p}': No such file or directory`); return; }
    if (paths.length > 1) printDim((index ? '\n' : '') + p + ':');
    if (node.type === 'file') {
      printHtml(long ? longRow(path, node, p) : cmdButton(p, 'cat ' + path, 'file'));
      return;
    }
    let entries = Object.entries(node.children);
    if (!showAll) entries = entries.filter(([name]) => !name.startsWith('.'));
    if (!entries.length) return;
    if (long) printHtml(entries.map(([name, child]) => longRow(join(path, name), child, name)).join(''));
    else {
      printHtml('<div class="ls-short">' + entries.map(([name, child]) => {
        const childPath = join(path, name);
        const label = name + (child.type === 'dir' ? '/' : '');
        const cmd = (child.type === 'dir' ? 'cd ' : 'cat ') + childPath;
        return cmdButton(label, cmd, child.type);
      }).join('') + '</div>');
    }
  });
}

function cmdCd(args) {
  if (args.length > 1) { printErr('bsh: cd: too many arguments'); return; }
  const previous = session.cwd;
  let dest;
  if (!args.length) dest = HOME;
  else if (args[0] === '-') dest = session.prev;
  else dest = resolvePath(session.cwd, args[0]);
  const node = nodeAt(dest);
  if (!node) { printErr(`bsh: cd: ${args[0]}: No such file or directory`); return; }
  if (node.type !== 'dir') { printErr(`bsh: cd: ${args[0]}: Not a directory`); return; }
  session.prev = previous;
  session.cwd = dest;
  renderDir(dest);
  reveal(dest);
  if (args[0] === '-') print(displayPath(dest));
}

function showFile(path, node, raw) {
  renderFile(path);
  reveal(parent(path));
  if (raw) {
    print(node.body.replace(/\s+$/, ''));
    if (!session.told && node.format !== 'plain') {
      printDim('the pane above renders this. cat is the source.');
      session.told = true;
    }
  } else {
    printDim('opened ' + shellArg(session.cwd, path) + ' in less.');
    setPane('page');
  }
}

function cmdCat(args) {
  if (!args.length) { printErr('bsh: cat: missing operand'); return; }
  args.forEach((arg) => {
    const path = resolvePath(session.cwd, arg);
    const node = nodeAt(path);
    if (!node) { printErr(`bsh: cat: ${arg}: No such file or directory`); return; }
    if (node.type === 'dir') { printErr(`bsh: cat: ${arg}: Is a directory`); return; }
    showFile(path, node, true);
  });
}

function cmdOpen(args) {
  if (!args.length) { print(displayPath(session.cwd)); return; }
  const key = args[0].toLowerCase();
  if (Object.prototype.hasOwnProperty.call(EXTERNAL, key)) {
    const url = EXTERNAL[key];
    if (url.startsWith('mailto:')) window.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
    print(url.replace('mailto:', ''));
    return;
  }
  const path = resolvePath(session.cwd, args[0]);
  const node = nodeAt(path);
  if (!node) { printErr(`bsh: open: ${args[0]}: No such file or directory`); return; }
  if (node.type === 'dir') {
    session.prev = session.cwd;
    session.cwd = path;
    renderDir(path);
    reveal(path);
    setPane('page');
    return;
  }
  showFile(path, node, false);
}

function cmdHead(args) {
  let count = 12;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-n') count = parseInt(args[++i], 10);
    else if (/^-n\d+$/.test(args[i])) count = parseInt(args[i].slice(2), 10);
    else if (/^-\d+$/.test(args[i])) count = parseInt(args[i].slice(1), 10);
    else files.push(args[i]);
  }
  if (!files.length) { printErr('bsh: head: missing file operand'); return; }
  if (!Number.isFinite(count) || count < 0) count = 12;
  files.forEach((arg) => {
    const path = resolvePath(session.cwd, arg);
    const node = nodeAt(path);
    if (!node) { printErr(`bsh: head: ${arg}: No such file or directory`); return; }
    if (node.type === 'dir') { printErr(`bsh: head: ${arg}: Is a directory`); return; }
    print(node.body.split('\n').slice(0, count).join('\n'));
    renderFile(path);
  });
}

function cmdGrep(args) {
  if (!args.length) { printErr('bsh: grep: usage: grep <text> [path]'); return; }
  let start = session.cwd;
  let parts = args;
  if (args.length >= 2) {
    const maybe = resolvePath(session.cwd, args[args.length - 1]);
    if (nodeAt(maybe)) {
      start = maybe;
      parts = args.slice(0, -1);
    }
  }
  const pattern = parts.join(' ');
  if (!pattern) { printErr('bsh: grep: empty pattern'); return; }
  const hits = search(pattern, start).slice(0, 40);
  if (!hits.length) { printDim('no matches.'); return; }
  printHtml(hits.map((hit) => {
    const rel = shellArg(session.cwd, hit.path);
    const snippet = hit.text.length > 140 ? hit.text.slice(0, 140) + '…' : hit.text;
    return `<div class="grep-line">${cmdButton(rel, 'open ' + hit.path, 'file')}<span class="dim">:${hit.line}:</span> ${escapeHtml(snippet)}</div>`;
  }).join(''));
  if (hits.length === 40) printDim('stopped after 40 matches.');
}

function cmdFind(args) {
  const query = args.join(' ').toLowerCase();
  const nodes = collectNodes(session.cwd).filter((path) => {
    if (!query) return true;
    const n = nodeAt(path);
    return path.toLowerCase().includes(query) || (n.blurb || '').toLowerCase().includes(query);
  });
  if (!nodes.length) { printDim('no matches.'); return; }
  printHtml(nodes.map((path) => {
    const n = nodeAt(path);
    const rel = shellArg(session.cwd, path);
    const label = (rel || '.') + (n.type === 'dir' ? '/' : '');
    const cmd = (n.type === 'dir' ? 'cd ' : 'open ') + path;
    return `<div>${cmdButton(label, cmd, n.type)}</div>`;
  }).join(''));
}

function cmdTree(args) {
  const all = args.some((a) => a.startsWith('-') && a.includes('a'));
  const pathArg = args.find((a) => !a.startsWith('-'));
  const start = pathArg ? resolvePath(session.cwd, pathArg) : session.cwd;
  const node = nodeAt(start);
  if (!node) { printErr(`bsh: tree: ${pathArg}: No such file or directory`); return; }
  const lines = [];
  const rootLabel = displayPath(start);
  lines.push(cmdButton(rootLabel, node.type === 'dir' ? 'cd ' + start : 'open ' + start, node.type));
  const walk = (path, current, prefix) => {
    let entries = Object.entries(current.children);
    if (!all) entries = entries.filter(([name]) => !name.startsWith('.'));
    entries.forEach(([name, child], index) => {
      const last = index === entries.length - 1;
      const childPath = join(path, name);
      const label = name + (child.type === 'dir' ? '/' : '');
      const cmd = (child.type === 'dir' ? 'cd ' : 'open ') + childPath;
      lines.push(`<span class="dim">${escapeHtml(prefix + (last ? '└── ' : '├── '))}</span>${cmdButton(label, cmd, child.type)}`);
      if (child.type === 'dir') walk(childPath, child, prefix + (last ? '    ' : '│   '));
    });
  };
  if (node.type === 'dir') walk(start, node, '');
  printHtml(lines.map((line) => `<div class="tree-out">${line}</div>`).join(''));
}

function cmdWc(args) {
  if (!args.length) { printErr('bsh: wc: missing file operand'); return; }
  args.forEach((arg) => {
    const path = resolvePath(session.cwd, arg);
    const node = nodeAt(path);
    if (!node) { printErr(`bsh: wc: ${arg}: No such file or directory`); return; }
    if (node.type !== 'file') { printErr(`bsh: wc: ${arg}: Is a directory`); return; }
    const lines = node.body.split('\n').length;
    const words = node.body.trim() ? node.body.trim().split(/\s+/).length : 0;
    print(`${String(lines).padStart(7)} ${String(words).padStart(7)} ${String(byteSize(node.body)).padStart(7)} ${arg}`);
  });
}

function helpHtml() {
  const rows = HELP_GROUPS.map(([title, items]) => {
    const head = `<div class="help-h">${title}</div>`;
    const body = items.map(([name, desc]) => (
      `<div class="help-row"><b>${name}</b><span>${desc}</span></div>`
    )).join('');
    return head + body;
  }).join('');
  return `<div class="help">${rows}</div>`;
}

function runSim(sim) {
  const gen = ++simGen;
  const workers = [...sim.querySelectorAll('.worker')];
  const steps = [...sim.querySelectorAll('.step')];
  const log = sim.querySelector('.sim-log');
  const alive = () => gen === simGen && sim.isConnected;
  const setWorkers = (active) => {
    workers.forEach((worker, index) => {
      worker.classList.toggle('busy', index === active);
      worker.querySelector('em').textContent = index === active ? 'busy' : 'waiting';
    });
  };
  const lines = [
    'accept()  →  fd 7, taken off the listen backlog',
    'enqueue(7)  queue depth 1. the main thread goes back to accept.',
    'notify_one()  worker 0 wakes. the other three stay asleep.',
    'read(fd 7)  →  "GET / HTTP/1.1"',
    'send()  200 OK. Content-Length is set, so the client does not wait forever.',
  ];
  (async () => {
    setWorkers(-1);
    steps.forEach((step) => step.classList.remove('on'));
    for (let i = 0; i < lines.length; i++) {
      if (!alive()) return;
      steps[i].classList.add('on');
      setWorkers(i >= 2 ? 0 : -1);
      log.textContent = lines[i];
      await new Promise((resolve) => setTimeout(resolve, 680));
    }
    if (!alive()) return;
    setWorkers(-1);
    log.textContent = 'worker 0 is waiting again. four threads, not one per client. that is the design.';
  })();
}

const commands = {
  help() { printHtml(helpHtml()); },
  man(args) {
    if (!args.length) { commands.help(); return; }
    const name = args[0];
    const text = MANUAL[name];
    if (!text) { printErr(`No manual entry for ${name}`); return; }
    print(`${name}\n\n${text}`);
  },
  ls: cmdLs,
  cd: cmdCd,
  pwd() { print(session.cwd); },
  cat: cmdCat,
  open: cmdOpen,
  head: cmdHead,
  grep: cmdGrep,
  find: cmdFind,
  tree: cmdTree,
  wc: cmdWc,
  echo(args) { print(expandVars(args.join(' '))); },
  whoami() { print(session.user); },
  id() {
    if (session.user === 'guest') print('uid=1001(guest) gid=1001(guest) groups=1001(guest)');
    else print('uid=1000(biraj) gid=1000(biraj) groups=1000(biraj),10(systems)');
  },
  uname(args) {
    if (args.includes('-a')) print(`bsh 0.4.2 ${HOST} #1 SMP youngstown x86_64`);
    else print('bsh');
  },
  hostname() { print(HOST); },
  uptime() { print(uptimeString()); },
  date() {
    print(new Date().toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).replace(/,/g, ''));
  },
  ps() {
    print([
      '  PID TTY   STAT CMD',
      '    1 ?     Ss   init',
      '   42 tty1  R+   -bsh',
      '  108 ?     S    http-server --port 8080 --workers 4',
      '  214 ?     S    cloudrx.service',
      '  330 ?     S    cloudwatch-agent',
    ].join('\n'));
  },
  motd() {
    const node = nodeAt('/etc/motd');
    print(node.body.trim());
    renderFile('/etc/motd');
  },
  theme(args) {
    if (!args.length) {
      print('theme: ' + (document.documentElement.dataset.theme || 'amber'));
      print('themes: amber  lab  paper');
      return;
    }
    if (!applyTheme(args[0])) printErr(`bsh: theme: ${args[0]}: no such theme. try amber, lab, or paper.`);
    else print('theme: ' + args[0]);
  },
  history() {
    if (!session.history.length) { printDim('no history yet.'); return; }
    print(session.history.map((item, i) => `${String(i + 1).padStart(4)}  ${item}`).join('\n'));
  },
  clear() {
    const el = document.getElementById('scrollback');
    if (el) el.innerHTML = '';
  },
  sim() {
    const path = HOME + '/projects/http-server';
    session.cwd = parent(path);
    renderFile(path);
    reveal(session.cwd);
    setPane('page');
    requestAnimationFrame(() => {
      const sim = document.getElementById('sim');
      if (sim) runSim(sim);
    });
  },
  fetch() {
    print([
      `${session.user}@${HOST}`,
      '----------------',
      'os        bsh 0.4.2 (youngstown)',
      'host      ' + HOST,
      'shell     bsh',
      'editor    less, and a compiler',
      'school    YSU  ·  CS  ·  math minor  ·  3.72',
      'work      CloudRx',
      'pool      4 workers, currently asleep',
      'uptime    ' + uptimeString().replace(/^up /, ''),
      'theme     ' + (document.documentElement.dataset.theme || 'amber'),
    ].join('\n'));
  },
  make() { print("make: Nothing to be done for 'all'."); },
  logout() { logout(); },
  exit() { logout(); },
};

const ALIASES = { ll: ['ls', '-l'], la: ['ls', '-la'], less: ['open'] };
const COMMAND_NAMES = Object.keys(commands).concat(Object.keys(ALIASES), ['vim', 'nano', 'sudo'], [...WRITE_CMDS]);

function suggest(cmd) {
  if (!cmd || cmd.length > 24) return null;
  const limit = cmd.length <= 3 ? 1 : 2;
  let best = null;
  let bestDist = limit + 1;
  for (const name of Object.keys(commands)) {
    const d = editDistance(cmd, name);
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return bestDist <= limit ? best : null;
}

function editDistance(a, b) {
  const rows = [];
  for (let i = 0; i <= b.length; i++) rows[i] = [i];
  for (let j = 0; j <= a.length; j++) rows[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
    }
  }
  return rows[b.length][a.length];
}

function execute(raw) {
  let args = tokenize(raw);
  if (!args.length) return;
  let cmd = args.shift();
  if (ALIASES[cmd]) {
    const [real, ...pre] = ALIASES[cmd];
    cmd = real;
    args = pre.concat(args);
  }
  if (WRITE_CMDS.has(cmd)) { printErr(`bsh: ${cmd}: read-only file system`); return; }
  if (cmd === 'sudo') {
    printErr(`${session.user} is not in the sudoers file. This incident will be reported.`);
    return;
  }
  if (cmd === 'vim' || cmd === 'nano') {
    printErr(`bsh: ${cmd}: not installed.`);
    if (args[0]) cmdOpen(args);
    else printDim('the pane on the right is already a reader.');
    return;
  }
  const fn = commands[cmd];
  if (!fn) {
    printErr(`bsh: ${cmd}: command not found`);
    const found = nodeAt(resolvePath(session.cwd, cmd));
    if (found) printDim(`there is a ${found.type} named ${cmd}. try: ${found.type === 'dir' ? 'cd' : 'cat'} ${cmd}`);
    else {
      const guess = suggest(cmd);
      if (guess) printDim(`did you mean ${guess}?`);
    }
    return;
  }
  fn(args);
}

function runLine(line) {
  const raw = String(line || '').trim();
  if (!raw) return;
  echoLine(raw);
  session.history.push(raw);
  session.histIndex = session.history.length;
  execute(raw);
  refreshChrome();
  const input = document.getElementById('cmd');
  if (input) input.value = '';
  scrollTerm();
}

function commonPrefix(list) {
  if (!list.length) return '';
  let prefix = list[0];
  for (const value of list.slice(1)) {
    let i = 0;
    while (i < prefix.length && i < value.length && prefix[i] === value[i]) i++;
    prefix = prefix.slice(0, i);
  }
  return prefix;
}

function complete(line) {
  const trailing = /\s$/.test(line);
  const parts = tokenize(line.trim());
  if (!line.trim()) return { line, labels: [] };
  if (parts.length === 1 && !trailing) {
    const matches = COMMAND_NAMES.filter((name) => name.startsWith(parts[0]) && name !== parts[0]);
    const unique = [...new Set(matches)];
    if (unique.length === 1) return { line: unique[0] + ' ', labels: [] };
    const prefix = commonPrefix(unique.filter((name) => name.startsWith(parts[0])));
    return { line: prefix || line, labels: unique.length > 1 ? unique : [] };
  }
  const token = trailing ? '' : parts[parts.length - 1];
  const base = trailing ? line : line.slice(0, line.length - token.length);
  const slash = token.lastIndexOf('/');
  const dirPart = slash === -1 ? '' : token.slice(0, slash);
  const namePrefix = slash === -1 ? token : token.slice(slash + 1);
  const dirPath = resolvePath(session.cwd, dirPart || '.');
  const node = nodeAt(dirPath);
  if (!node || node.type !== 'dir') return { line, labels: [] };
  let names = Object.keys(node.children).filter((name) => name.startsWith(namePrefix));
  if (!namePrefix.startsWith('.')) names = names.filter((name) => !name.startsWith('.'));
  const withSlash = names.map((name) => {
    const child = node.children[name];
    const shown = (dirPart ? dirPart.replace(/\/?$/, '/') : '') + name + (child.type === 'dir' ? '/' : '');
    return { shown, dir: child.type === 'dir', label: name + (child.type === 'dir' ? '/' : '') };
  });
  if (withSlash.length === 1) {
    return { line: base + withSlash[0].shown + (withSlash[0].dir ? '' : ' '), labels: [] };
  }
  if (withSlash.length < 2) return { line, labels: [] };
  const prefix = commonPrefix(withSlash.map((item) => item.shown));
  return { line: base + prefix, labels: withSlash.map((item) => item.label) };
}

function onTab() {
  const input = document.getElementById('cmd');
  const result = complete(input.value);
  input.value = result.line;
  if (result.labels && result.labels.length > 1) {
    printHtml('<div class="ls-short">' + result.labels.map((label) => (
      `<span class="${label.endsWith('/') ? 'dirword' : ''}">${escapeHtml(label)}</span>`
    )).join('  ') + '</div>');
  }
}

function applyTheme(name) {
  if (!THEMES.includes(name)) return false;
  document.documentElement.dataset.theme = name;
  try { localStorage.setItem('bsh-theme', name); } catch (err) { /* private mode */ }
  const meta = document.querySelector('meta[name="theme-color"]');
  const colors = { amber: '#100e0c', lab: '#0b1016', paper: '#efeae0' };
  if (meta) meta.content = colors[name];
  const button = document.getElementById('theme-btn');
  if (button) {
    button.textContent = name;
    button.setAttribute('aria-label', `Theme ${name}. Activate to change.`);
  }
  return true;
}

function cycleTheme() {
  const current = document.documentElement.dataset.theme || 'amber';
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  applyTheme(next);
}

function startClock() {
  if (clockOn) return;
  clockOn = true;
  const tick = () => {
    const el = document.getElementById('clock');
    if (!el) return;
    const now = new Date();
    el.dateTime = now.toISOString();
    el.textContent = now.toLocaleString('en-US', {
      weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };
  tick();
  setInterval(tick, 10000);
}

function printMotd(openedDeep) {
  const lines = [];
  if (session.user === 'guest') lines.push('Guest access. Same files.', '');
  lines.push(
    'bsh 0.4.2 (youngstown)  ·  kernel-lab tty1',
    '',
    'Last login: now, from the public internet.',
    '',
    'ls            what is in the room',
    'cd projects   the systems work',
    'help          the short manual',
  );
  if (!openedDeep) {
    lines.push('', 'README is open on the right. cat shows the source. the pane renders it.');
  }
  print(lines.join('\n'));
}

function enterDesktop(opts = {}) {
  if (opts.user) session.user = opts.user;
  if (opts.restore) session.user = sessionStorage.getItem('bsh-user') || session.user;
  session.startedAt = session.startedAt || Date.now();
  try {
    sessionStorage.setItem('bsh-authed', '1');
    sessionStorage.setItem('bsh-user', session.user);
  } catch (err) { /* private mode */ }
  document.documentElement.classList.remove('booting', 'login-now', 'resume-session');
  document.getElementById('login').classList.remove('on');
  document.getElementById('desktop').classList.add('on');
  setPane('page');
  const hash = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  let opened = false;
  if (hash) {
    const path = hash.startsWith('/') ? resolvePath('/', hash) : resolvePath(HOME, hash);
    opened = place(path);
    if (!opened) printErr(`bsh: ${hash}: No such file or directory`);
  }
  if (!opened) {
    session.cwd = HOME;
    session.prev = HOME;
    renderFile(HOME + '/README');
    reveal(HOME);
  }
  if (opts.restore) print('session restored.');
  else printMotd(opened);
  refreshChrome();
  startClock();
  if (isWide()) document.getElementById('cmd').focus();
}

function logout() {
  try {
    sessionStorage.removeItem('bsh-authed');
    sessionStorage.removeItem('bsh-user');
  } catch (err) { /* private mode */ }
  history.replaceState(null, '', location.pathname + location.search);
  session.user = 'biraj';
  session.cwd = HOME;
  session.prev = HOME;
  session.open = null;
  session.history = [];
  session.histIndex = 0;
  session.told = false;
  const scrollback = document.getElementById('scrollback');
  if (scrollback) scrollback.innerHTML = '';
  const input = document.getElementById('cmd');
  if (input) input.value = '';
  document.getElementById('desktop').classList.remove('on');
  document.getElementById('login').classList.add('on');
  const msg = document.getElementById('login-msg');
  msg.className = 'login-msg';
  msg.textContent = 'logged out.';
  const user = document.getElementById('login-user');
  user.value = '';
  document.getElementById('login-pass').value = '';
  user.focus();
  document.title = 'biraj@kernel-lab — bsh';
}

function showLogin() {
  bootTimers.forEach(clearTimeout);
  bootTimers = [];
  document.documentElement.classList.remove('booting');
  document.documentElement.classList.add('login-now');
  document.getElementById('login').classList.add('on');
  const user = document.getElementById('login-user');
  if (user) user.focus();
}

function startBoot() {
  const log = document.getElementById('boot-log');
  const lines = [
    ['ok', 'bsh 0.4.2  (youngstown)'],
    ['ok', 'mounted /home/biraj'],
    ['ok', 'ext2 superblock   magic 0xEF53'],
    ['ok', 'thread pool   4 workers, asleep'],
    ['ok', 'cloudrx.service   active (running)'],
    ['ok', 'interface   youngstown, ohio'],
    ['ok', 'tty1 ready'],
  ];
  lines.forEach((line, i) => {
    bootTimers.push(setTimeout(() => {
      const row = document.createElement('div');
      row.className = 'boot-line';
      row.innerHTML = `<span class="ok">${line[0]}</span><span>${escapeHtml(line[1])}</span>`;
      log.appendChild(row);
    }, 150 * i));
  });
  bootTimers.push(setTimeout(showLogin, 150 * lines.length + 620));
}

function bind() {
  document.getElementById('skip-boot').addEventListener('click', showLogin);
  document.addEventListener('keydown', (e) => {
    if (!document.documentElement.classList.contains('booting')) return;
    if (e.key === 'Tab') return;
    e.preventDefault();
    showLogin();
  });

  const form = document.getElementById('login-form');
  const user = document.getElementById('login-user');
  const pass = document.getElementById('login-pass');
  const msg = document.getElementById('login-msg');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (user.value.trim() || 'biraj').toLowerCase();
    if (name !== 'biraj' && name !== 'guest') {
      msg.className = 'login-msg bad';
      msg.textContent = 'Login incorrect. Known users: biraj, guest.';
      form.classList.add('denied');
      setTimeout(() => form.classList.remove('denied'), 450);
      user.select();
      return;
    }
    pass.value = '';
    user.value = '';
    msg.textContent = '';
    enterDesktop({ user: name });
  });
  document.getElementById('login-quick').addEventListener('click', () => {
    user.value = 'biraj';
    form.requestSubmit();
  });

  document.getElementById('prompt-form').addEventListener('submit', (e) => {
    e.preventDefault();
    runLine(document.getElementById('cmd').value);
  });

  const input = document.getElementById('cmd');
  let draft = '';
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      onTab();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (session.histIndex === session.history.length) draft = input.value;
      if (session.histIndex > 0) {
        session.histIndex -= 1;
        input.value = session.history[session.histIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (session.histIndex < session.history.length) {
        session.histIndex += 1;
        input.value = session.histIndex === session.history.length ? draft : session.history[session.histIndex];
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      echoLine(input.value + '^C');
      input.value = '';
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      commands.clear();
    } else if (e.key === 'd' && e.ctrlKey && input.value === '') {
      e.preventDefault();
      logout();
    }
  });

  document.getElementById('desktop').addEventListener('click', (e) => {
    const twist = e.target.closest('[data-twist]');
    if (twist) {
      const path = twist.dataset.twist;
      if (expanded.has(path)) expanded.delete(path);
      else expanded.add(path);
      renderTree();
      return;
    }
    const go = e.target.closest('[data-go]');
    if (go) {
      visit(go.dataset.go, go.closest('#tree') ? 'tree' : 'viewer');
      return;
    }
    const cmd = e.target.closest('[data-cmd]');
    if (cmd) {
      runLine(cmd.dataset.cmd);
      if (isWide()) input.focus();
    }
  });

  document.getElementById('brand').addEventListener('click', goHome);
  document.getElementById('theme-btn').addEventListener('click', cycleTheme);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.querySelectorAll('.tabs button').forEach((button) => {
    button.addEventListener('click', () => setPane(button.dataset.pane));
  });

  document.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      const prev = button.textContent;
      button.textContent = 'copied';
      setTimeout(() => { button.textContent = prev; }, 1200);
    } catch (err) {
      button.textContent = text;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('desktop').classList.contains('on')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    if (e.key === 'Escape') {
      setPane('shell');
      input.focus();
      return;
    }
    if (e.key.length !== 1) return;
    e.preventDefault();
    setPane('shell');
    input.focus();
    input.value += e.key;
  });

  const handle = document.getElementById('resize');
  handle.addEventListener('pointerdown', (e) => {
    if (!isWide()) return;
    e.preventDefault();
    const term = document.getElementById('term');
    const startY = e.clientY;
    const startH = term.offsetHeight;
    const move = (ev) => {
      const next = Math.min(window.innerHeight * 0.72, Math.max(120, startH + (startY - ev.clientY)));
      document.getElementById('desktop').style.setProperty('--term-h', next + 'px');
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

function init() {
  bind();
  let stored = null;
  try { stored = localStorage.getItem('bsh-theme'); } catch (err) { /* private mode */ }
  applyTheme(THEMES.includes(stored) ? stored : (document.documentElement.dataset.theme || 'amber'));
  let authed = false;
  try { authed = sessionStorage.getItem('bsh-authed') === '1'; } catch (err) { /* private mode */ }
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (authed) enterDesktop({ restore: true });
  else if (reduce) showLogin();
  else startBoot();
}

if (typeof document === 'undefined') {
  const assert = (cond, msg) => {
    if (!cond) {
      console.error('FAIL', msg);
      process.exitCode = 1;
    }
  };
  try {
    assert(resolvePath('/home/biraj', 'projects') === '/home/biraj/projects', 'relative');
    assert(resolvePath('/home/biraj/projects', '..') === '/home/biraj', 'parent');
    assert(resolvePath('/etc', '~/notes/sockets') === '/home/biraj/notes/sockets', 'tilde');
    assert(resolvePath('/home/biraj', '~') === HOME, 'tilde home');
    assert(resolvePath('/home/biraj/projects', '../work/cloudrx') === '/home/biraj/work/cloudrx', 'dotdot');
    assert(nodeAt('/home/biraj/projects/http-server').type === 'file', 'server file');
    assert(nodeAt('/home/biraj/projects/http-server').widget === 'pool', 'widget');
    assert(nodeAt('/nope') === null, 'missing');
    assert(tokenize('grep "thread pool" notes').join('|') === 'grep|thread pool|notes', 'quotes');
    assert(displayPath('/home/biraj/projects') === '~/projects', 'display');
    const readme = nodeAt('/home/biraj/README').body;
    assert(readme.includes('`ls`'), 'inline code stored');
    const html = renderMarkdown(readme);
    assert(html.includes('<h1>'), 'heading');
    assert(html.includes('data-cmd="open ~/projects"'), 'internal link');
    assert(!renderMarkdown('# Hi\n\n<script>alert(1)</script>').includes('<script>'), 'escaped');
    assert(search('0xEF53', '/').length > 0, 'search magic');
    assert(search('Content-Length', HOME + '/projects').some((h) => h.path.endsWith('http-server')), 'search server');
    const walk = (path) => {
      const n = nodeAt(path);
      assert(n && n.blurb, 'blurb ' + path);
      if (n.type === 'file') assert(n.body && n.body.trim().length > 0, 'body ' + path);
      else Object.keys(n.children).forEach((name) => walk(join(path, name)));
    };
    walk('/');
    const done = complete('cd proj');
    assert(done.line.startsWith('cd projects'), 'complete cd ' + done.line);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
  if (!process.exitCode) console.log('bsh self-check ok');
} else {
  init();
}

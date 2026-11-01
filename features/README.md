# Feature modules

One folder per feature that has been ported from a course drill into the kit:

```
features/<name>/
  current/     the active version of the module
  archive/vN/  every earlier version, unchanged (decision 4)
  test.*       the feature's own test, run by the shared checks
```

A course switches a feature on in its `course.js` (`features.<name> = { version, ...options }`).
A feature listed in `FEATURES.md` but not yet here is kept, unchanged, at the course
repo and commit its version line names; it is ported when a course's material calls
for it (decision 7), by a kit pull request that adds the module, its test and the
updated catalog entry.

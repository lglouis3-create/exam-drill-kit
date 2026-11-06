---
name: exam-drill-dashboard
description: "Show Louis's Exam Drill Dashboard: every registered course with its lifecycle status, next and final exam, what is published and what is known but not released, kit version and available updates, open problems; the improvement registry; pull requests and previews waiting for his approval; and the automations with their last runs. Use when Louis says \"Show my Exam Drill Dashboard\", \"exam drill dashboard\", \"course dashboard\" or asks how his courses or automations stand."
---

# Exam Drill Dashboard

The dashboard is a monitoring view built from the coordinator's records in this repository
(`coordinator/`) and from live repository data. Showing it changes nothing: no record, branch,
pull request or site.

1. In the kit checkout: `git fetch -q origin main`, then work from `origin/main`'s
   `coordinator/` files (`git worktree add` a scratch checkout of `origin/main`, or
   `git show origin/main:<path>` into a scratch folder), so the dashboard reflects merged
   records, not a stale branch.
2. Run `node coordinator/coord.js dashboard` from that checkout. It reads repository heads with
   `git ls-remote`, course files and pull requests with `gh api`, and prints Markdown. With no
   network, add `--offline` and say that heads, course files and pull requests were not read.
3. Add what only the session can read: list the scheduled tasks (`list_triggers`) and, for each
   automation in the dashboard's last section, give its most recent run and next run from that
   list. A scheduled task that wakes a session records only that the wake was delivered; say so.
   Do not mark an automation active unless the list shows it enabled and it has fired.
4. Show the dashboard in the conversation as it was printed, with your additions marked as
   such. Keep the four sections: Courses, Improvements, Approvals, Automation activity.
5. Under Approvals, list only what the output found in repositories: pull requests whose own
   description says they wait for Louis, failed or cancelled checks, previews that differ from
   the live site, and repositories that could not be read. Never infer an approval.
6. If Louis asks for a page, publish the same content as a private Artifact; otherwise the
   conversation is the dashboard.

End with at most three lines: what needs Louis today, in order of urgency.

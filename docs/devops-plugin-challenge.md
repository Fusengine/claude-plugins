# Challenge: fuse-devops plugin (pre-commit)

Date: 2026-11-10. Challenger: `challenger-devops`. Read-only review; this report is the only file written.

## Verdict: CONFIRMED (on the sampled scope; 0 BLOCKER, 0 MAJOR, 4 MINOR)

Claim challenged: "The new plugin `fuse-devops` (plugins/devops-expert: agent `devops-expert` + skills) is structurally sound, is correctly wired into the repo, introduces no regression for the other plugins, and its content is safe to ship: an agent following these skills would not be led into a destructive or wrong operation by a false technical statement."

Failure scenario (concrete): none found that leads to a destructive or failed operation. The four findings below are wording or consistency defects. None is BLOCKER or MAJOR.

Out of scope, as instructed: `skills/devops-databases/`, `skills/devops-opnsense/`, and the 17→18 skills / 235→236 counter changes the coordinator announced.

## Findings

| # | file:line | Statement | Source proving it wrong | Severity | Corrected text |
|---|-----------|-----------|-------------------------|----------|----------------|
| 1 | `plugins/devops-expert/skills/devops-gitops-packaging/references/templates/flux/kustomization.yaml:15` (with `SKILL.md:81`) | The `infrastructure` Kustomization ships `prune: true` with the default `deletionPolicy` (MirrorPrune) and no comment. The skill's own rule (SKILL.md:81) says "Pruning: Off by default or `confirm`". If an agent copies this file, then deleting or renaming that Kustomization (or its path in Git) deletes everything it applied, including CRDs and therefore every custom resource that depends on them. | `references/flux.md:23,53` in this same skill (MirrorPrune deletes all applied objects when the Kustomization is deleted); https://fluxcd.io/flux/components/kustomize/kustomizations/ | MINOR (the deletion itself is gated by `flux.md:53` WAIT-FOR-GO, but the template contradicts the skill's rule) | Replace line 15 with: `  prune: true                    # deletes objects removed from Git; reviewed by PR (see flux.md)` followed by a new line `  deletionPolicy: Orphan         # deleting this Kustomization keeps CRDs and controllers (MirrorPrune would delete them and every CR)`. Change SKILL.md:81 to: `\| **Pruning** \| Argo CD: off or \`Prune=confirm\`. Flux: \`prune\` is required; set \`prune: true\` only with \`deletionPolicy: Orphan\` on infrastructure/CRD Kustomizations; a prune is a delete (see Critical Rules) \|` |
| 2 | `plugins/devops-expert/skills/devops-iac/SKILL.md:83` | "`Telmate/proxmox` has only release candidates" | https://registry.terraform.io/v1/providers/Telmate/proxmox/versions lists stable 2.9.11 / 2.9.13 / 2.9.14 next to the 3.0.2-rcNN line. The skill's own `provider-proxmox.md:19` states this correctly. | MINOR | `` `bpg/proxmox` is the maintained Proxmox provider; `Telmate/proxmox` publishes only release candidates on its 3.x line (last stable 2.9.14) `` |
| 3 | `plugins/devops-expert/skills/devops-k8s-cluster/references/node-lifecycle.md:58` | `QUORUM   3 members -> 2 after this runs: zero further failures tolerated until a replacement joins`. The PROOF line just below (59) requires that the replacement control-plane node has already joined, so at that point the cluster has 4 members and the reset takes it to 3. The text contradicts the procedure it sits in. | Internal: same file, lines 37-42 ("add first, remove second") and line 59; quorum table in `etcd-backup-restore.md:18-23` | MINOR | `QUORUM   with the replacement already joined: 4 -> 3 members (1 failure tolerated); without a replacement: 3 -> 2 (zero failures tolerated) - state which case applies` |
| 4 | `docs/README.md:11` | "[Skills](workflow/skills.md) - 105 framework skills". On disk there are 235 skills, and the same commit changed the counters around this line to 42 agents / 235 skills. | `find plugins/*/skills -mindepth 2 -maxdepth 2 -name SKILL.md \| wc -l` returns 235; the line is already present at HEAD (pre-existing, not a regression) | MINOR | `- [Skills](workflow/skills.md) - 235 specialized skills` (or 236 once `devops-opnsense` lands) |

## Checked and found correct

Structure and regression:
- All 16 in-scope `SKILL.md` frontmatters parse (Bun YAML) and contain `name, description, versions, user-invocable, references, related-skills`. Each `name` equals its folder name.
- Every listed reference exists, and no file under `references/` is unlisted (all 16 skills).
- Every `related-skills` entry resolves to a real skill folder, including `fuse-security:dependency-audit`.
- The agent's `skills:` list equals the 17 folders, plus `fuse-ai-pilot:fuse-browser-usage`. That skill exists and other agents (sniper, astro-expert, …) already list it.
- The plugin has no `hooks/` folder. The `.harness/` cache folders are git-ignored (`.gitignore:61`).
- No French text found by an accent scan and a stop-word scan.
- `bun test`: 384 pass, 0 fail (35 files).
- `bunx tsc --noEmit -p scripts`: exit 0.
- `bash scripts/validate-agents.sh`: "No critical errors detected". The only warning is the pre-existing one on `ai-pilot/agents/challenger.md`.
- `marketplace.json` has a valid `fuse-devops` entry pointing to `./plugins/devops-expert`, and its name matches `plugin.json`.
- Detection rule (`01-project-detection.md`): the row is placed in the lowest tier, and the priority line says framework and language experts always win. A lone Dockerfile or `docker-compose.yml` is excluded. `.github/workflows/` and a bare `k8s/` folder are not indicators. A Next.js, Laravel or Go repo therefore still routes to its own expert, so no app repo is stolen.
- Counters: 28 plugin dirs (same convention as HEAD's 27, `_archive` included), 42 agent files, 235 `SKILL.md`. These match README.md:3 and :21, docs/README.md:9, docs/workflow/agents.md:3 and docs/workflow/skills.md:3.

Safety of destructive content (each has a correct effect statement and the propose-then-go format):
- ZFS `zfs-destructive-ops.md`: destroy `-nv`, rollback `-r`/`-R` semantics, `receive -F`, `zpool destroy`/`import -D`, `add -n`, `remove -n -p`, checkpoint blocking, wipe.
- Ceph `ceph-destructive-ops.md`: `orch osd rm` drain, `osd purge --yes-i-really-mean-it`, pool delete with `mon_allow_pool_delete`, ratio and `min_size` overrides.
- Backups `backup-destructive-ops.md`: restic/borg/velero/bucket/wipefs. The `restic-maintenance.sh` template previews by default and needs `--apply` to delete.
- etcd `etcd-backup-restore.md`: the restore stops all API servers; `etcdutl` replaces the `etcdctl snapshot restore` removed in 3.6; `--bump-revision --mark-compacted`; member remove with quorum arithmetic.
- kubeadm `node-lifecycle.md`: the reset phases remove the local stacked etcd member; the leftovers list is right.
- Vault/SOPS/Sealed Secrets/Kubernetes encryption `destructive-secret-ops.md`: the unrecoverable column and the PROOF prerequisites are right.
- LVM/filesystems `storage-lvm-fs.md`: XFS is treated as grow-only, ext4 is shrunk offline only, and `wipefs` without `-a` only lists.
- Networking `safe-network-changes.md`: the `nft-safe-apply.sh` template checks first, writes a reloadable backup (`flush ruleset` + list), schedules the systemd-run revert before applying, and `set -e` aborts if the timer cannot be created. The `flush ruleset` warning about Docker/libvirt tables is present in `nftables.conf`.
- Proxmox `cluster-quorum.md`: delnode after power-off, `pvecm expected 1` split-brain warning, corosync.conf edit via copy, token formula. `guests-qm-pct.md`: `qm`/`pct destroy --purge`/`--destroy-unreferenced-disks`.
- IaC `state-surgery.md`: backup first; `state mv/rm/push -force`, `force-unlock` and `workspace delete -force` effects.
- GitOps: the Argo CD `application.yaml` defaults to manual sync with `Prune=confirm`, and `flux delete` is gated.
- Docker `safe-ops.md`: prune/volume/`down -v` effects.
- Kubernetes `kubectl-safe-ops.md`: `--force --grace-period=0`, namespace delete, drain flags.
- Virtualization `safe-change-protocol.md`: `destroy` vs `undefine` vs `--remove-all-storage`.
- OpenStack `kolla-ansible.md`: `destroy`.
- Ansible `safe-run-protocol.md`: check/diff caveats.

Fact spot-check (official sources fetched today):
- Flux `ImageUpdateAutomation` nests `git.commit.author.{email,name}`, and the template matches. Source: https://fluxcd.io/flux/components/image/imageupdateautomations/
- OTel Collector v0.144.0 renamed `otlp`→`otlp_grpc` and `otlphttp`→`otlp_http`, with deprecated aliases. Source: https://github.com/open-telemetry/opentelemetry-collector/releases/tag/v0.144.0
- Promtail EOL on 2026-03-02. Source: https://grafana.com/docs/loki/latest/send-data/promtail/
- MinIO community repository "NO LONGER MAINTAINED", AGPLv3, AIStor alternatives. Source: https://raw.githubusercontent.com/minio/minio/master/README.md
- Terraform licence is BSL 1.1, licensor IBM, for 1.6.0 and later. Source: https://raw.githubusercontent.com/hashicorp/terraform/main/LICENSE
- Helm 4 flags: `--rollback-on-failure` defaults `--wait` to watcher; `--wait` strategies watcher/hookOnly/legacy with hookOnly as default; `--server-side` auto; `--force-conflicts`; `--force-replace`. Source: https://helm.sh/docs/helm/helm_upgrade/
- Kubernetes etcd page: production minimums 3.4.29+ / 3.5.11+, five-member recommendation. Source: https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/
- Proxmox: `token_coefficient` default 650 ms, 125 ms on new clusters since 9.2, token+consensus below 30 s and below 45 s with HA, watchdog at 60 s. Source: https://pve.proxmox.com/pve-docs/pvecm.1.html
- Argo CD `Prune=confirm` is valid at application level in `syncPolicy.syncOptions`. Source: https://raw.githubusercontent.com/argoproj/argo-cd/master/docs/user-guide/sync-options.md
- OpenStack SLURP rules (tested paths, deprecations only across SLURP, support window). Source: https://raw.githubusercontent.com/openstack/governance/master/resolutions/20220210-release-cadence-adjustment.rst
- kubeadm `v1beta4` template fields (`kubeletExtraArgs` as a name/value list, `proxy.disabled`, `encryptionAlgorithm`, `certificateValidityPeriod`): checked against the v1beta4 schema as named in the template header. The page itself was not re-fetched; see Not checked.

## Not checked

- `skills/devops-databases/` and `skills/devops-opnsense/` (out of scope).
- Reference files not opened: most of devops-cicd, devops-observability (beyond the OTel/Promtail lines), devops-sre-ops, devops-ansible (beyond safe-run), devops-openstack (beyond kolla destroy and SLURP), devops-virtualization (beyond the safe-change protocol), devops-linux (beyond storage), devops-secrets (beyond the destructive catalogue), devops-kubernetes manifests templates, and devops-docker templates.
- The kubeadm v1beta4 reference page was not re-fetched, and the comment in `kubeadm-ha-config.yaml:3` that `--certificate-key` cannot be mixed with `--config` was not verified.
- `docker system prune` "all build cache" wording (`safe-ops.md:38`) was not verified. The CLI warning reads "unused build cache"; the skill overstates, which errs on the safe side.
- OpenStack release names after 2026.1 and the maintenance phases.
- No template was executed against a real host or cluster. Exa is down and the Context7 quota is exhausted, so fact checks used fuse-browser only, with one official source per fact.

## devops-opnsense

Challenger `challenger-opnsense`, 2026-11-10. Claim: the skill is structurally sound, lists and counters are consistent at 18 / 236, and no false statement would lock an operator out or lose configuration.

### Verdict: CONFIRMED (0 BLOCKER, 0 MAJOR, 3 MINOR)

### Findings
1. MINOR - wrong menu for option 8. `plugins/devops-expert/skills/devops-opnsense/SKILL.md:127` and `references/console-vm-pfsense.md:13` call option 8 a "console menu" entry. snapshots.html places "8. Boot Environments" in the boot loader menu (press Space during boot); the console menu is where option 12 (update) lives (updates.html). During a failed upgrade an operator already at the console menu would look for the rollback in the wrong place. `upgrade-rollback.md:38,43` and `templates/rollback-checklist.md:4` are already correct.
   Corrected text for SKILL.md:127: `Boot loader menu (press Space during boot): option 8 = Boot Environments (ZFS snapshots). Console menu: option 12 = update / major upgrade.`
   Corrected text for console-vm-pfsense.md:13: `- Boot loader menu (press Space during boot): option 8 = Boot Environments (snapshots.html). Console menu: option 12 = firmware upgrade (updates.html). Other option numbers: not verified.`
   Sources: https://docs.opnsense.org/manual/snapshots.html, https://docs.opnsense.org/manual/updates.html
2. MINOR - wrong apply verb for firewall rules. `references/safe-opnsense-changes.md:47` names "API `reconfigure` on firewall/interfaces". For MVC filter rules the apply call is `POST /api/firewall/filter/apply` (API page: controller `filter_base`, command `apply`; source `FilterBaseController::applyAction()` runs `filter reload skip_alias`). `reconfigure` exists for `firewall/alias` and `firewall/group` only. Core master has no savepoint or timed rollback action in `FilterController`/`FilterBaseController`, so the "no timed auto-revert" note stays right.
   Corrected text for line 47: `| API apply: \`POST firewall/filter/apply\` (rules), \`POST firewall/alias/reconfigure\` or \`firewall/group/reconfigure\` | Reloads the live ruleset immediately; no timed rollback exists in the core API | Same as GUI apply: console path and config backup first |`
   Same correction for `references/backup-restore-api.md:25`: replace "The generic applied step for rules and interfaces is not verified" with `Rules apply with POST \`firewall/filter/apply\`; the interface apply step is not verified.`
   Sources: https://docs.opnsense.org/development/api/core/firewall.html, https://github.com/opnsense/core/blob/master/src/opnsense/mvc/app/controllers/OPNsense/Firewall/Api/FilterBaseController.php
3. MINOR - missing scope for `opnsense-revert`. `references/upgrade-rollback.md:49` says its behavior "was not read". The update README states it: "revert any package to a previous state of a particular OPNsense release", within the scope of the package mirrors.
   Corrected text: `- \`opnsense-revert\`: reverts a package to its state in a given OPNsense release, within what the package mirrors still hold (opnsense/update README). Flags not read: do not state any.`
   Source: https://raw.githubusercontent.com/opnsense/update/master/README.md

### Checked and found correct
- Structure: the frontmatter parses (Bun YAML) with exactly `name, description, versions, user-invocable, references, related-skills`. `name` matches the folder. The 19 references match the files on disk exactly. The 10 related skills exist. No French, no realistic credential, and `plugins/devops-expert` has no `hooks/` directory.
- Counts: 18 skill directories = 18 `devops-*` entries in the agent's `skills:` = 18 rows in `docs/plugins/devops.md` = 18 in `docs/workflow/skills.md`. `README.md:3,21`, `docs/README.md:11` and `docs/workflow/skills.md:3` say 236, and `docs/workflow/skills.md` has 236 rows. `docs/devops-plugin-structure.md:63` says "218", but it is a planning note that records the state before the change, not a live counter.
- Regression: `bun test` gave 384 pass / 0 fail (35 files). `bunx tsc --noEmit -p scripts` exited 0. `bash scripts/validate-agents.sh` reported "No critical errors detected" (1 existing warning on `ai-pilot/agents/challenger.md`).
- Safety: every row of the operations table has a console path or rollback before the action. Major upgrade, HA failover and `opnsense-bootstrap` use ACTION/EFFECT/PROOF/ROLLBACK/WAIT-FOR-GO. No instruction can cut management access without a rollback.
- Facts checked at the source:
  - DHCP: Dnsmasq is the default, Kea suits more than 1000 clients and HA, ISC is end of life (dhcp.html).
  - Rules: MVC rules are the default and `os-firewall-legacy` is optional. The order is floating, then group, then interface, with priorities 200000/300000/400000. `quick` is the default. NAT is processed before filter rules (firewall.html).
  - API: basic auth with the key as username and the secret as password. `POST core/service/search` works with the body given. `GET firewall/alias/get` and `POST firewall/alias/reconfigure` exist (api.html, core firewall API page).
  - Upgrades: option 12, major upgrades installed offline, Production release type (updates.html). Snapshots require ZFS; the Space/8/2/ENTER sequence is right (snapshots.html).
  - `opnsense-update` and `opnsense-bootstrap` (`-r 26.7` on FreeBSD 15.1, does not wipe the config by default) match the update README.
  - HA (hacarp.html): commit on the master, then sync. The backup holds no sync settings. Preempt is grouped by default. "Sync compatibility" was added in 24.7, so both nodes must run the same version. The cron job runs only when every CARP interface is MASTER.
  - Release line: 26.7 "Xenial Xenops", 26.7.8 dated 2026-10-30, FreeBSD 15.1, OpenSSL 3.5, OpenVPN 2.7, PHP 8.5, Python 3.13. The 26.7.8 notes match (CE_26.7.html).
  - Terraform: `templates/opentofu-opnsense.tf` uses only attributes in the provider's `opnsense_firewall_filter` schema (`enabled`, `description`, `interface.interface`, `filter.action/direction/protocol/source.net/destination.net/port/log`). The provider takes `uri` plus `OPNSENSE_API_KEY`/`OPNSENSE_API_SECRET`, and its README says it is not for production (browningluke docs).

### Not checked
- The HA upgrade order, the ha-carp maintenance-mode menu and the Ansible collection `oxlorg.opnsense` (name and status). The author listed the first two as not verified.
- vpn.md, multiwan.md, plugins-proxy-ids.md, troubleshooting-order.md and dns-dhcp.md beyond the DHCP table.
- Whether `templates/config-backup.sh` can read `/conf/config.xml` as the non-root `backup-admin` user. If it cannot, the script fails without changing anything on the firewall.
- No template was run against a real OPNsense. Exa is down, so each fact was checked with fuse-browser against one official source.

## devops-databases

Challenger `challenger` (devops-databases), 2026-11-10. Claim: the skill (SKILL.md + 16 references + 11 templates) is complete, correct, safe, and breaks nothing in the repo; counters at 18 / 236.

### Verdict: REFUTED on one point (0 BLOCKER, 1 MAJOR, 3 MINOR)

Structure, wiring, regression and the destructive-action gating hold. The claim "correct" fails on one template line: followed literally, `patroni.yml` blocks `pg_rewind`, so a failed-over old primary cannot rejoin by itself. The fix is one line.

### Findings
1. MAJOR - `pg_rewind` is rejected by the generated `pg_hba`. `plugins/devops-expert/skills/devops-databases/references/templates/patroni.yml:55-59` allows only `replication` for `replicator` from the DB subnet, `all` from the app subnet, then `reject`. The template also defines `postgresql.authentication.rewind` (`rewind_user`, line 78-80) and `use_pg_rewind: true` (line 42). `pg_rewind` opens a normal (non-replication) connection from the rejoining node to the new leader. With distinct DB and app subnets, as the placeholders suggest, that connection hits `reject`. After every failover the old primary fails to rewind and needs a manual `patronictl reinit`, so the cluster runs without one replica until someone acts. Patroni writes `pg_hba.conf` from this list only ("list of lines that Patroni will use to generate pg_hba.conf"). `templates/pg_hba.conf.example:15-18` has the same gap: no rewind entry.
   Corrected text (insert after line 57): `        - hostssl all rewind_user CHANGE_ME_db_subnet/24 scram-sha-256   # pg_rewind from a rejoining member`
   Sources: https://patroni.readthedocs.io/en/latest/dynamic_configuration.html (pg_hba), https://patroni.readthedocs.io/en/latest/yaml_configuration.html (rewind: "user for pg_rewind")
2. MINOR - the restore does not disable archiving itself. `references/templates/restore-test-pitr-runbook.md:22` puts `archive_mode = off` "in a `pgbackrest.conf`". It is a PostgreSQL parameter, not a pgBackRest option. pgBackRest has the restore option `--archive-mode=off` (default `preserve`), documented for exactly this case: "it is not a good idea to push WAL from the cluster into the repository". Step 4 (line 29) does say to start with `archive_mode = off`, so this is a single safety net, not a gap. But when `postgresql.conf` lives in the data directory (RHEL, Patroni), the restored file still carries the production `archive_command` until the operator edits it.
   Corrected text for line 22: `... and a \`pgbackrest.conf\` with the same stanza; the restore below uses \`--archive-mode=off\` so the restored instance never pushes WAL.` Add `--archive-mode=off` to the restore commands at runbook line 26 and `templates/pgbackrest-commands.md:42,44,46` (test restores only, not the `--type=standby` line 48).
   Source: https://pgbackrest.org/command.html (Archive Mode `--archive-mode`)
3. MINOR - deprecated CNPG field. `references/templates/cnpg-cluster.yaml:94` sets `monitoring.enablePodMonitor: true`. The CNPG 1.30 monitoring doc says: "The `.spec.monitoring.enablePodMonitor` field ... is now deprecated and will be removed in a future version", and recommends a manually created `PodMonitor`.
   Corrected text: `    enablePodMonitor: false          # deprecated in CNPG 1.30; create a PodMonitor yourself (devops-observability)`
   Source: https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.30/docs/src/monitoring.md
4. MINOR - the PostgreSQL 18 route is missing. `references/schema-changes-safe.md:36` gives only the CHECK-constraint workaround for `SET NOT NULL`. PostgreSQL 18 allows `NOT VALID` on NOT NULL constraints, and `SET NOT NULL` validates an invalid one. The workaround stays correct, so this is an omission, not an error.
   Corrected text for the "Safe pattern" cell: `18+: \`ADD CONSTRAINT nn NOT NULL col NOT VALID\`, then \`VALIDATE CONSTRAINT nn\`; older: add a CHECK \`NOT VALID\`, \`VALIDATE\`, \`SET NOT NULL\`, drop the check`
   Sources: https://www.postgresql.org/docs/release/18.0/ ("Allow ALTER TABLE to set the NOT VALID attribute of NOT NULL constraints"), https://www.postgresql.org/docs/18/sql-altertable.html

### Checked and found correct
- Structure: the frontmatter parses (Bun YAML) with exactly `name, description, versions, user-invocable, references, related-skills`, the same set as `devops-opnsense`. `name` matches the folder. The 27 listed references match the files on disk exactly (0 unlisted, 0 missing). The 8 related skills exist. There is no `plugins/devops-expert/hooks/`, and the plugin has 18 skill directories. No French was found. No realistic credential was found (`CHANGE_ME` placeholders only).
- Wiring: `devops-databases` appears in `agents/devops-expert.md:8` (`skills:`) and the routing row at :59, `plugins/devops-expert/README.md:32`, `docs/plugins/devops.md:36` (consistent with the frontmatter scope) and `docs/workflow/skills.md:332`. `README.md:3,21`, `docs/README.md:11` and `docs/workflow/skills.md:3` say 236.
- Regression: `bun test` gave `384 pass / 0 fail` (35 files). `bunx tsc --noEmit -p scripts` gave `tsc exit 0`. `bash scripts/validate-agents.sh` reported `No critical errors detected`.
- Safety: `destructive-actions.md` requires ACTION/EFFECT/PROOF/UNRECOVERABLE/WAIT-FOR-GO, a standing PROOF of the newest backup plus the restore-test date, and a go that names the object. It covers DROP DATABASE/TABLE, `patronictl failover`/`reinit`/`pause`, `pg_drop_replication_slot`, VACUUM FULL/CLUSTER/REINDEX, `pg_upgrade --link`/`--swap`, `expire`/`stanza-delete`, CNPG Cluster/PVC/namespace deletion, major image change, and FLUSHALL/FLUSHDB. Switchover is gated on `patronictl list` lag (`ha-patroni.md:24-31`). Restores go to a new host or namespace; `--delta` is marked D. The CNPG recovery cluster explicitly avoids `isWALArchiver` on the production store. No sentence was found that loses data if followed literally.
- Versions (postgresql.org/support/versioning): 18.6 / 17.11 / 16.15 / 15.19 / 14.24 are current, 14 has its final release on 2026-11-12, and 19 RC1 came out on 2026-10-15. pgBackRest 2.60.0 was released on 2026-10-18 (release.html). Patroni 4.1.5 is the top entry (releases.html). PgBouncer 1.26.1 was released on 2026-10-14 with three CVE fixes (changelog). CNPG 1.30.1 is listed (release notes v1.30.md). 1.30.x supports Kubernetes 1.34-1.36 and PostgreSQL 14-18 (supported_releases.md). The default operand image `18.6-system-trixie` is in the release notes.
- pgBackRest: every option in `pgbackrest.conf` exists in configuration.html (`repo-block`, `repo-bundle`, `compress-type`/`compress-level`, `process-max`, `start-fast`, `archive-async`, `spool-path`, `backup-standby`, `repo-s3-*`, `repo-retention-diff`, `pg-socket-path`, `pg-host-user`, `log-*`). "repo-bundle must be enabled before repo-block" is respected. The `--target-action` default is `pause` (command.html). `stanza-delete` requires a shut-down cluster or `--force`. The 2.60.0 restore error on an invalid page checksum and the `checksum-page-error` option match the release notes. The weak-subkey notice for versions before 2.59.3 matches news.html.
- Patroni: `ttl` min 20, `retry_timeout` min 3, the `loop_wait + 2 * retry_timeout <= ttl` rule, `failsafe_mode`, `pg_hba`, the etcd3 TLS keys, `watchdog.safety_margin` and the tags `nofailover/noloadbalance/clonefrom/nosync` all match the docs.
- CNPG: `barmancloud.cnpg.io/v1` ObjectStore, `postgresql.cnpg.io/v1` Cluster/Pooler/ScheduledBackup, the plugin `barman-cloud.cloudnative-pg.io`, the six-field cron, and `backupOwnerReference` self/cluster/none.
- PgBouncer (config.html, changelog): `auth_type` defaults to md5; `max_prepared_statements` "non-zero value" enables tracking; `query_wait_timeout` defaults to 120; `auth_user`'s password comes from `auth_file`; `auth_query` must return two columns and no row for an unknown user; the SECURITY DEFINER pattern is right; search_path is tracked since 1.26.0, and `ignore_startup_parameters = search_path` restores the 1.25 behaviour in 1.26.1.
- PostgreSQL 18: `log_lock_waits` defaults to off (runtime-config-logging, 18). Data checksums are the initdb default, with the new `--no-data-checksums` option. `pg_upgrade --swap` is new in 18 (release 18.0).

### Not checked
- mysql-mariadb-ops.md, redis-valkey-ops.md and mongodb-pointers.md facts (the MySQL/MariaDB/Redis/Valkey version strings in the frontmatter), monitoring-queries.sql, postgres-roles-auth.md, replication-streaming-logical.md, vacuum-bloat-wraparound.md and major-upgrades.md beyond the `--swap`/`--link` lines.
- `postgresql-tuned.conf` defaults other than `log_lock_waits`, `log_checkpoints` and `password_encryption`. The sizing numbers are practice, not manual values.
- Whether the owner of `pgbouncer.get_auth` can read `pg_authid`. As written, the superuser who runs `CREATE FUNCTION` owns it, so it should work; the template wording "non-superuser SECURITY DEFINER function" (`pgbouncer.ini:43`) is ambiguous.
- No template was run against a real PostgreSQL, Patroni, PgBouncer or CNPG. Exa and Context7 are down, so each fact was checked against one official source (curl/grep of the official pages).

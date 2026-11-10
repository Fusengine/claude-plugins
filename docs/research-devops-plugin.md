# Research: `fuse-devops` plugin (agent `devops-expert` + skills)

Date read: 2026-11-10. Author: `devops-research`. Scope: research only, no skill/agent files written.

Evidence convention: `[F]` = fetched this session with fuse-browser (URL given, read 2026-11-10); `[E]` = endoflife.date API (cross-check, read 2026-11-10); `[G]` = GitHub releases/tags API (read 2026-11-10); `[C7]` = Context7 library resolution. Exa returned HTTP 401 (invalid API key) for every call, so the third source was GitHub API + endoflife.date cross-check, not Exa. Overall confidence: **medium** (see "Not verified").

---

## 1. Final skill list (challenged)

Prefix `devops-`. Tier: P0 = named by the owner, P1 = needed for completeness of a self-hosting engineer, P2 = useful, build last.

| # | Skill | Tier | Scope (one line) | Explicitly out of scope |
|---|-------|------|------------------|-------------------------|
| 1 | `devops-docker` | P0 | Docker Engine, Compose, BuildKit, Dockerfile practice, container networking/firewall, registries, image supply chain (SBOM, cosign signing), Podman/Quadlet as the rootless/systemd alternative | Kubernetes, security audit of images (security-expert), Swarm beyond a note |
| 2 | `devops-kubernetes` | P0 | Workloads, scheduling, Services, Gateway API (Ingress frozen), storage, RBAC, kubectl safe operations, troubleshooting (CKA/CKAD scope) | Cluster install/upgrade (skill 3), Helm/GitOps (skill 4), CKS-style hardening audit |
| 3 | `devops-k8s-cluster` | P1 | Cluster lifecycle: kubeadm, k3s, Talos, Cluster API, etcd backup/restore, upgrades and version skew, CNI (Cilium), LB for bare metal | Managed cloud Kubernetes (EKS/GKE/AKS) |
| 4 | `devops-gitops-packaging` | P1 | Helm 4, Kustomize, Argo CD, Flux, drift/prune safety, promotion between environments | Application code CI (skill 12) |
| 5 | `devops-linux` | P0 | Day-2 Linux admin: systemd, packages, users/SSH, kernel params, LVM/filesystems, SELinux/AppArmor, timers/cron, performance and disk troubleshooting, bash scripting | Hardening/audit (security-expert), network stack (skill 6) |
| 6 | `devops-networking` | P1 | nftables, bridges/bonding/VLAN, routing, DNS (authoritative/resolver), TLS/ACME, reverse proxy (Traefik/Caddy/Nginx/HAProxy), WireGuard | Pentest, WAF rule design, public-cloud networking |
| 7 | `devops-proxmox` | P0 | Proxmox VE 9.x: cluster, HA/CRS, SDN, storage, firewall, LXC (incl. OCI), `qm`/`pct`/`pvesh`, templates + cloud-init, API automation | PBS/backup design (skill 14), generic KVM (skill 8) |
| 8 | `devops-virtualization` | P1 | KVM/QEMU/libvirt (`virsh`), LXC/Incus, cloud-init, image building with Packer | Proxmox specifics (skill 7), OpenStack Nova (skill 9) |
| 9 | `devops-openstack` | P0 | Service map, release/upgrade model (SLURP), Kolla-Ansible / OpenStack-Ansible / OpenStack-Helm deployment, openstack CLI, day-2 ops and troubleshooting, Ceph integration | Public-cloud migration advice |
| 10 | `devops-iac` | P1 | Terraform and OpenTofu (state, modules, plan/apply discipline, licensing choice), providers for Proxmox/OpenStack/DNS, Terragrunt | Ansible (skill 11), cloud-account landing zones |
| 11 | `devops-ansible` | P1 | ansible-core, playbooks/roles/collections, inventory, idempotence, check mode, vault, Molecule | Terraform (skill 10) |
| 12 | `devops-cicd` | P1 | GitHub Actions, GitLab CI, self-hosted runners, caching, environments and approvals, release pipelines | Repo release/commit flow (existing commit agent), SAST (security-expert) |
| 13 | `devops-observability` | P1 | Prometheus, Alertmanager, Grafana, Loki, Alloy, OpenTelemetry Collector, exporters, dashboards-as-code | Incident process (skill 15) |
| 14 | `devops-storage-backup` | P1 | ZFS, Ceph, LVM-thin/NFS, Proxmox Backup Server, restic/borg, 3-2-1, mandatory restore tests, DR | Database logical backup details (skill 16) |
| 15 | `devops-sre-ops` | P2 | SLI/SLO and alert policy, runbooks, incident response, postmortems, change management, capacity, DR drills | Tool config (skills 13, 14) |
| 16 | `devops-secrets` | P1 | SOPS + age, Vault and OpenBao, External Secrets, Kubernetes Secrets handling, rotation | Secret scanning of repos (security-expert) |
| 17 | `devops-databases` | P2 | PostgreSQL HA (Patroni, pgBackRest, CloudNativePG), MariaDB/Galera, PITR, upgrade/failover runbooks | Application schema/ORM (stack agents) |

### What I added versus the lead draft, and why
- `devops-k8s-cluster` (split from Kubernetes): the CKA weights "Cluster Architecture, Installation & Configuration" at 25% and "Troubleshooting" at 30% [F: CKA page]; one skill would blur lifecycle with workload usage. Distributions (k3s, Talos), Cluster API and etcd belong here.
- `devops-virtualization`: LFCS "Operations Deployment" explicitly includes "Manage Virtual Machines (libvirt)" and "Configure container engines" [F: LFCS page]. Proxmox alone does not cover plain KVM/libvirt hosts, Incus (v7.6.0 [G]) or cloud-init/Packer image pipelines. Packer and cloud-init are merged here, not separate skills.
- `devops-databases`: a self-hoster runs PostgreSQL/MariaDB on the same VMs; HA and PITR are the most common data-loss path. Kept P2 because product versions are not verified (see below).
- `devops-sre-ops`: incident response, runbooks, SLO, postmortem are agent behaviour, not tooling; merged into one P2 skill (no separate "runbooks" and "SRE").
- `devops-secrets` and `devops-storage-backup` as the lead drafted, but ZFS/Ceph live in storage-backup (Proxmox skill links to it) to avoid duplication.

### Merged or dropped
- Merged: bash scripting into `devops-linux` (LFCS "Essential Commands" covers git, services, SSL certificates, disk space [F]); systemd into `devops-linux`; Podman and registry/supply chain (SBOM, cosign v3.1.4 [G]) into `devops-docker`; service mesh/Cilium/Gateway API into `devops-kubernetes` + `devops-k8s-cluster` (no standalone mesh skill: Gateway API v1.7.0 [G] lists Cilium among implementations [F]); Packer and cloud-init into `devops-virtualization`; Terragrunt into `devops-iac`.
- Dropped: cost/FinOps and public clouds (AWS/GCP/Azure). Reason: owner scope is self-hosted Proxmox/OpenStack/containers; the Terraform/OpenTofu skill covers any provider generically. Nothing in the sources read this session argues for them.
- Dropped: Jenkins as a skill (roadmap.sh names it, but self-hosted GitHub/GitLab runners cover the need; not verified that the owner uses it). Cover as one reference line in `devops-cicd` if wanted.

### Comparison with recognised references
- roadmap.sh DevOps (https://roadmap.sh/devops, read 2026-11-10 [F]): the fetch returned only the intro text, which names scripting (Python/JS), Ansible, Terraform, Docker, Kubernetes, Jenkins, Git, CI/CD, cloud, monitoring/logging. The full node tree was not readable (JS-rendered) so the topic-by-topic comparison is **not verified**. The skill list covers every named item except cloud and Jenkins (deliberate).
- CNCF Trail Map (https://github.com/cncf/trailmap): the content is an image (`CNCF_TrailMap_latest.png/pdf`) [F]; stages were not readable, so no claim. CNCF Landscape (https://landscape.cncf.io/) is JS-only, not read.
- LF/CNCF curricula: CKA domains verified: Troubleshooting 30%, Cluster Architecture/Installation/Configuration 25%, Services & Networking 20%, Workloads & Scheduling 15%, Storage 10% (https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/ [F]). LFCS domains verified: Operations Deployment 25%, Networking 25%, Storage 20%, Essential Commands 20%, Users and Groups 10% (https://training.linuxfoundation.org/certification/linux-foundation-certified-system-administrator-lfcs/ [F]). Curriculum PDFs exist in https://github.com/cncf/curriculum (`CKA_Curriculum_v1.37.pdf`, `CKAD_Curriculum_v1.37.pdf`, listed via GitHub contents API [F]); contents not read. CKS and CKAD domain weights not read.
- Mapping: LFCS networking list (packet filtering/NAT, bridge/bonding, static routing, reverse proxies and load balancers, SSH, time sync) maps to skill 6; LFCS storage list (LVM, filesystems, NFS/network block devices, swap, automounters) maps to skills 5 and 14.
- Proxmox admin guide (https://pve.proxmox.com/pve-docs/pve-admin-guide.html) and OpenStack admin guide: table-of-contents comparison **not verified** (Proxmox page fetched but only the introduction was inspected; docs.openstack.org returned 403 to fuse-browser and the fallback fetch returned no section list).

---

## 2. Per-skill reference topics and verified versions

Version table (all read 2026-11-10). Where two sources agree the cell says "2 src".

| Product | Current stable | Source | Notes |
|---------|----------------|--------|-------|
| Docker Engine | 29.9.3 (2026-11-03) | [F] https://docs.docker.com/engine/release-notes/29/ ; [E] agrees | 28.x EOL 2026-05-13 [E]; 29.9.3 ships BuildKit 0.34.2 security fixes |
| Docker Compose | v5.7.0 | [G] docker/compose | Compose major is 5.x; Context7 index lags (v5.6.1) [C7] |
| BuildKit | v0.34.2 | [G] moby/buildkit ; [F] release notes | |
| Podman | v6.1.4 | [G] (repo now `podman-container-tools/podman`, old `containers/podman` redirects) | Org move is a doc-link trap |
| Kubernetes | 1.37.2 (2026-10-27); 1.36.6; 1.35.10 | [E]; official page https://kubernetes.io/releases/ [F] (snapshot shows 1.37.1, 1.36.5; stale vs [E]) ; k3s tag `v1.37.2+k3s1` [G] corroborates 1.37.2 | Supported minors: 1.37, 1.36, 1.35; 1.34 EOL 2026-10-27 [E]; 1.37 released 2026-08-26 ("Garhwal", 67 enhancements, 16 Stable, 1 deprecation/removal) [F] https://kubernetes.io/blog/2026/08/26/kubernetes-v1-37-release/ |
| Ingress vs Gateway API | Ingress API frozen, no plans to remove; project recommends Gateway [F] https://kubernetes.io/docs/concepts/services-networking/ingress/ | Ingress NGINX: best-effort until March 2026, then no releases/fixes [F] https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/ | Gateway API v1.7.0 [G] |
| Cilium | v1.20.4 | [G] | |
| etcd / Cluster API | etcd v3.7.3 ; Cluster API v1.14.4 | [G] | |
| Talos / k3s | Talos v1.14.5 ; k3s v1.37.2+k3s1 | [G] | |
| Helm | v4.3.1 (2026-10-15) | [G] helm/helm | Helm 4 line; Helm 3 status not verified |
| Kustomize | v5.8.3 | [G] | |
| Argo CD | 3.6.1 (2026-11-04) | [E] + [G] (2 src) | 3.3 EOL 2026-11-04 [E] |
| Flux | v2.10.0 | [G] | |
| External Secrets | v2.15.0 | [G] | |
| Proxmox VE | 9.2 (2026-05-21): Debian 13.5, kernel 7.0, QEMU 11.0, LXC 7.0, ZFS 2.4, Ceph Squid 19.2.3 / Tentacle 20.2.1 | [F] https://pve.proxmox.com/wiki/Roadmap ; [E] latest 9.2 | PVE 8 EOL 2026-08-31 [E]. 9.2 features: dynamic HA load balancing (CRS), cluster-wide HA arm/disarm, SDN WireGuard + BGP fabrics, route maps/prefix lists, custom CPU models in UI, live snapshots with TPM on volume-chain storage. 9.1 (2025-11-19): LXC from OCI images (tech preview), TPM state in qcow2, SDN status in GUI. arm64 build released 2026-08-05 |
| Proxmox firewall | nftables-based firewall still tech preview since 8.2, roadmap says eventual replacement of iptables firewall | [F] Roadmap page | Do not claim it is GA |
| Proxmox Backup Server | 4.2 (2026-04-29), Debian 13.4, kernel 7.0, ZFS 2.4.1 | [F] https://pbs.proxmox.com/wiki/Roadmap | S3-compatible datastore officially supported (left tech preview), push sync with server-side encryption, move groups/namespaces, `worker-threads` for sync; push sync since 3.3; PDM integration on roadmap |
| Proxmox Datacenter Manager | version not read | https://pdm.proxmox.com/docs/ fetched, version not extracted | Not verified |
| OpenStack | 2026.2 "Hibiscus", initial release 2026-09-30, maintained, EOL planned 2028-04-26; 2026.1 "Gazpacho" (SLURP, unmaintained 2027-10-27); 2025.2 "Flamingo"; 2027.1 "Indri" in development (release 2027-03-24, SLURP) | [F] https://raw.githubusercontent.com/openstack/releases/master/data/series_status.yaml | Docs landing page confirms 2026.2 "the latest release" (WebFetch of https://docs.openstack.org/2026.2/). SLURP releases are the supported skip-level upgrade path (2026.1 -> 2027.1) |
| Kolla-Ansible / OpenStack-Ansible | per-series versions | not verified (tags API returned only old `-eol` tags; docs.openstack.org 403 via fuse-browser) | Skill author must read https://docs.openstack.org/kolla-ansible/latest/ and https://docs.openstack.org/openstack-ansible/latest/ |
| Ceph | 21 "Umbrella" 21.2.0 (2026-10-28); 20 "Tentacle" 20.2.5; 19 "Squid" 19.2.7 (EOL 2026-12-02) | [E] | PVE 9.2 ships Squid and Tentacle, not Umbrella; do not recommend Umbrella for PVE |
| Terraform | 1.17.1 (2026-10-28); 1.16.7; 1.15 EOL 2026-10-21 | [E] + [G] (2 src) | License: Business Source License, licensor IBM, applies to 1.6.0+, change license MPL 2.0 after 4 years; internal use not "competitive" [F] https://raw.githubusercontent.com/hashicorp/terraform/main/LICENSE |
| OpenTofu | 1.13.9 (2026-11-05); 1.12.12 | [E] + [G] (2 src) | Linux Foundation, "drop-in replacement for Terraform"; features unique to it include `-exclude` (since 1.9) [F] https://opentofu.org/ |
| Ansible | ansible-core 2.22.0 (2026-11-02); 2.21.6; 2.20.11; 2.19 EOL 2026-11-30 | [E]; maintenance model [F] https://docs.ansible.com/projects/ansible/latest/reference_appendices/release_and_maintenance.html | 2.22 control node Python 3.13-3.15, managed node 3.9-3.15 [E]; ansible-core maintains latest + two older |
| Packer / cloud-init | Packer v1.16.2 ; cloud-init 26.2 | [G] | |
| Debian | 13 "Trixie" 13.7 (2026-09-12), EOL 2030-06-30; 12 "Bookworm" 12.15, EOL 2028-06-30; 11 EOL 2026-08-31 | [E] | |
| Ubuntu | 26.04.1 LTS "Resolute Raccoon" (EOL 2031-05-29); 24.04.5 LTS; 26.10 released 2026-10-15 | [E] | |
| RHEL family | RHEL 10.2 (2026-05-20), RHEL 9.8 | [E] | Rocky/Alma point releases not checked |
| nftables | Replaces ip/ip6/arp/ebtables, kernel >= 3.13, iptables compat layer exists | [F] https://www.netfilter.org/projects/nftables/ | Tool version not read. Docker 29 nftables backend: `--firewall-backend=nftables`, **experimental**, not usable in Swarm mode, no `DOCKER-USER` chain [F] https://docs.docker.com/engine/network/firewall-nftables/ |
| WireGuard | wireguard-tools latest tag v1.0.20260223 | [G] | |
| Prometheus | 3.16.0 (2026-11-05); **LTS 3.13.5** (EOL 2027-07-31) | [E] + [G] | |
| Alertmanager / Alloy | v0.35.0 ; v1.21.3 | [G] | |
| Grafana | 13.3.0 (2026-10-27) | [E] only | |
| Loki | v3.7.9 | [G] | |
| OpenTelemetry Collector | v0.165.0 (core API v1.71.0), 2026-11-06 | [G] | Release notes list a breaking removal in `pkg/confighttp`; collector is still 0.x |
| Vault / OpenBao | Vault v2.2.1 ; OpenBao v2.7.2 (docs "Version 2.7.x"; "a Series of LF Projects") | [G]; [F] https://openbao.org/docs/what-is-openbao/ | Vault license not read; do not state it |
| SOPS | v3.13.3 | [G] | age version not checked |
| Traefik / Caddy | v3.7.18 ; v2.11.9 | [G] | |
| restic | v0.19.1 | [G] | borg not checked |
| cosign | v3.1.4 | [G] | |

### Reference topics per skill (become `references/*.md`)

1. `devops-docker`: engine-daemon-config (daemon.json, storage, logging, live-restore); compose-v5 (profiles, healthchecks, depends_on conditions, env/secrets); buildkit-dockerfile (multi-stage, cache mounts, multi-platform, SBOM/provenance attestations); networking-firewall (bridge/macvlan, published-ports vs host firewall, nftables backend experimental status); registries-supply-chain (registry:2/Harbor, cosign signing, digest pinning); podman-quadlet (rootless, systemd units); runtime-troubleshooting (OOM, healthcheck loops, disk usage, `docker system df`); safe-ops (prune, volume deletion).
2. `devops-kubernetes`: workloads-scheduling; services-gateway-api (HTTPRoute, migration from Ingress, Ingress NGINX retirement); storage-csi (PV/PVC/StorageClass, reclaim policy); config-secrets; rbac-serviceaccounts; resources-qos-hpa; kubectl-safe-ops (dry-run, diff, prune alpha); troubleshooting-playbook (pending/crashloop/DNS/network, 30% of CKA); deprecations-per-minor (read each release blog).
3. `devops-k8s-cluster`: kubeadm-install-upgrade; k3s (single/HA embedded etcd); talos; cluster-api; etcd-backup-restore; version-skew-upgrade-order; cni-cilium; bare-metal-lb-ingress (MetalLB or Cilium LB, Gateway implementations); node-maintenance (cordon/drain/PDB).
4. `devops-gitops-packaging`: helm-4 (charts, values, OCI registries, `helm diff`/rollback); kustomize (bases/overlays/patches); argocd (Application/ApplicationSet, sync/prune options, RBAC); flux (GitRepository, Kustomization, HelmRelease, image automation); secrets-in-gitops (SOPS, ESO); promotion-rollback; drift-detection.
5. `devops-linux`: systemd (units, timers, drop-ins, journald); packages-repos (apt/dnf, pinning, unattended upgrades); users-ssh-sudo; storage-lvm-fs (LVM, ext4/xfs, fstab, swap, automount, remote FS); kernel-sysctl-limits; selinux-apparmor (LFCS includes SELinux MAC); perf-troubleshooting (CPU/mem/IO/disk space); time-sync; scripting-bash (strict mode, shellcheck, idempotent scripts).
6. `devops-networking`: nftables-ruleset (tables/chains/sets/maps, NAT, atomic reload); interfaces-bridge-bond-vlan (netplan/systemd-networkd/NetworkManager/ifupdown2); routing-static-policy; dns (unbound/bind/CoreDNS, split DNS, DNSSEC basics); tls-acme (certbot/Caddy/Traefik ACME, DNS-01); reverse-proxy-lb (Traefik, Caddy, Nginx, HAProxy, keepalived); wireguard; diagnostics (ss, tcpdump, mtr).
7. `devops-proxmox`: cluster-corosync-quorum; storage-types (ZFS, LVM-thin, Ceph RBD, NFS, directory); vm-lxc-lifecycle (`qm`, `pct`, hookscripts, OCI containers tech preview); templates-cloud-init (`qm cloudinit`); ha-crs (affinity rules, dynamic load balancing in 9.2); sdn (zones, VNets, fabrics, EVPN; IPAM/DHCP tech preview); firewall (tech preview nftables vs legacy); api-pvesh-automation (tokens, API); upgrade-8-to-9 and 9.x minor upgrades (PVE 8 is EOL); ceph-integration.
8. `devops-virtualization`: libvirt-virsh (domains, networks, pools); qemu-kvm-tuning (CPU model, virtio, hugepages, NUMA); lxc-incus (images, profiles, clustering); cloud-init (NoCloud/datasource, user-data, network-config); packer (builders, provisioners, image pipelines); gpu-passthrough-vfio; nested-virt.
9. `devops-openstack`: service-map (Keystone, Nova, Neutron, Glance, Cinder, Swift, Placement, Horizon, Heat, Octavia, Ironic); release-upgrade-slurp; kolla-ansible (globals.yml, passwords, inventory, bootstrap/deploy/post-deploy); openstack-ansible; openstack-helm; networking-neutron (OVN, provider vs tenant); storage-cinder-ceph; operations-cli (`openstack` CLI, quotas, host aggregates, live migration); troubleshooting (logs, RabbitMQ, MariaDB/Galera, Placement); backup-of-control-plane.
10. `devops-iac`: terraform-vs-opentofu-decision (BSL/IBM vs LF; compatibility; state encryption is OpenTofu-side); state-backends-locking; modules-structure; plan-apply-discipline; providers-proxmox-openstack-dns; import-moved-refactor; testing (`tofu test`, checks); terragrunt; destroy-safeguards (`prevent_destroy`).
11. `devops-ansible`: inventory-vars; roles-collections-galaxy (requirements.yml); idempotence-check-diff; handlers-tags-serial; vault-sops; templates-jinja; molecule-testing; ansible-core-lifecycle (python matrix); proxmox-openstack-collections.
12. `devops-cicd`: github-actions (workflows, reusable workflows, environments, OIDC, pinning by SHA); gitlab-ci (stages, rules, includes, components); self-hosted-runners (isolation, ephemeral); caching-artifacts; deploy-pipelines (plan->approve->apply, GitOps handoff); pipeline-secrets; troubleshooting.
13. `devops-observability`: prometheus-config-scrape (service discovery, retention, remote write; LTS vs normal releases); alerting-alertmanager (routing, inhibition, silences); grafana-provisioning (dashboards/datasources as code); loki-alloy-logs; opentelemetry-collector (receivers/processors/exporters; breaking changes per 0.x release); exporters (node, cAdvisor, blackbox, pve-exporter, ceph); synthetic-uptime; capacity-metrics.
14. `devops-storage-backup`: zfs (pools, datasets, snapshots, send/receive, scrub, `zfs destroy -n`); ceph (cephadm, pools, CRUSH, release lifecycle); lvm-thin-nfs-iscsi; pbs (datastores, namespaces, sync/push, encryption, S3 backend, verify/GC); restic-borg; backup-strategy (3-2-1, immutability, retention); restore-testing (scheduled, evidence logged); disaster-recovery-runbook.
15. `devops-sre-ops`: slo-sli-error-budget; alert-quality (page vs ticket); runbook-template; incident-response-roles; postmortem-blameless; change-management-rollback; capacity-planning; dr-drills.
16. `devops-secrets`: sops-age (key custody, `.sops.yaml` rules); vault-vs-openbao (v2.2.x vs v2.7.x, license/governance difference to be read at source); external-secrets-operator; k8s-secret-risks (base64, etcd encryption at rest); rotation-leases; ssh-ca-and-certs; bootstrap-problem.
17. `devops-databases` (versions not verified): postgresql-ha-patroni; pgbackrest-pitr; cloudnativepg-on-k8s; mariadb-galera; major-upgrade-procedures; replication-monitoring; restore-drills.

---

## 3. Official documentation URLs and Context7 IDs

Context7 resolved this session [C7]; "none resolved" means not searched or not attempted (do not assume a missing ID means no library).

| Skill | Official docs a skill author must fetch | Context7 IDs |
|-------|-----------------------------------------|--------------|
| docker | https://docs.docker.com/engine/ , https://docs.docker.com/compose/ , https://docs.docker.com/build/ , https://docs.docker.com/engine/release-notes/29/ [F], https://docs.docker.com/engine/network/firewall-nftables/ [F], https://docs.podman.io/ , https://docs.sigstore.dev/ | `/docker/docs`, `/docker/compose` (v5.x listed), `/docker/cli`, `/websites/docker_reference` |
| kubernetes | https://kubernetes.io/docs/ , https://kubernetes.io/releases/ [F], https://gateway-api.sigs.k8s.io/ , release blogs per minor, CKA curriculum PDF in https://github.com/cncf/curriculum | `/websites/kubernetes_io` (High, 31694 snippets), `/kubernetes/website`, `/kubernetes/enhancements`, `/kubernetes/kubernetes` |
| k8s-cluster | https://kubernetes.io/docs/setup/production-environment/ , https://docs.k3s.io/ , https://www.talos.dev/ , https://cluster-api.sigs.k8s.io/ , https://docs.cilium.io/ , https://etcd.io/docs/ | none resolved |
| gitops-packaging | https://helm.sh/docs/ , https://kubectl.docs.kubernetes.io/ , https://argo-cd.readthedocs.io/ , https://fluxcd.io/flux/ | none resolved |
| linux | https://www.freedesktop.org/software/systemd/man/ , https://docs.kernel.org/ , https://wiki.debian.org/ , https://ubuntu.com/server/docs , https://docs.redhat.com/ , LFCS domains page [F] | none resolved |
| networking | https://wiki.nftables.org/ [F netfilter page], https://www.netfilter.org/projects/nftables/ [F], https://www.wireguard.com/ , https://doc.traefik.io/traefik/ , https://caddyserver.com/docs/ , https://nginx.org/en/docs/ | none resolved |
| proxmox | https://pve.proxmox.com/pve-docs/pve-admin-guide.html [F], https://pve.proxmox.com/wiki/Roadmap [F], https://pve.proxmox.com/pve-docs/qm.1.html [F], https://pbs.proxmox.com/docs/ , https://pdm.proxmox.com/docs/ [F] | `/proxmox/pve-docs` (4824 snippets), `/websites/pve_proxmox_pve-docs` (7447), `/proxmox/proxmox-backup` |
| virtualization | https://libvirt.org/docs.html , https://www.qemu.org/docs/master/ , https://linuxcontainers.org/incus/docs/main/ , https://cloudinit.readthedocs.io/ , https://developer.hashicorp.com/packer/docs | none resolved |
| openstack | https://docs.openstack.org/2026.2/ [F via WebFetch], https://docs.openstack.org/kolla-ansible/latest/ , https://docs.openstack.org/openstack-ansible/latest/ , https://docs.openstack.org/openstack-helm/latest/ , https://releases.openstack.org/ (fuse-browser got 403 on docs.openstack.org and releases.openstack.org; use WebFetch or `openstack/releases` raw YAML [F]) | `/websites/openstack` (200610 snippets), `/websites/openstack_api-ref`, `/openstack/neutron`, `/openstack/glance`, `/openstack/openstack-helm` |
| iac | https://opentofu.org/docs/ , https://developer.hashicorp.com/terraform/docs , Terraform plan reference [F] https://developer.hashicorp.com/terraform/cli/commands/plan , v1.x compatibility promises [F] , https://terragrunt.gruntwork.io/docs/ | `/websites/opentofu`, `/opentofu/opentofu` (v1.12.0 indexed), `/gruntwork-io/terragrunt`; Terraform not resolved |
| ansible | https://docs.ansible.com/projects/ansible/latest/ [F maintenance page], https://docs.ansible.com/projects/ansible/latest/reference_appendices/release_and_maintenance.html [F] | `/websites/ansible_projects_ansible` (157217 snippets), `/ansible/ansible-documentation`, `/ansible/ansible` |
| cicd | https://docs.github.com/actions , https://docs.gitlab.com/ci/ | none resolved |
| observability | https://prometheus.io/docs/ , https://grafana.com/docs/ , https://grafana.com/docs/loki/latest/ , https://grafana.com/docs/alloy/latest/ , https://opentelemetry.io/docs/collector/ | none resolved |
| storage-backup | https://openzfs.github.io/openzfs-docs/ , zfs-destroy man [F], https://docs.ceph.com/ , https://pbs.proxmox.com/wiki/Roadmap [F], https://restic.readthedocs.io/ , https://borgbackup.readthedocs.io/ | `/proxmox/proxmox-backup` |
| sre-ops | https://sre.google/books/ (not fetched) | none |
| secrets | https://getsops.io/docs/ , https://openbao.org/docs/ [F], https://developer.hashicorp.com/vault/docs , https://external-secrets.io/ , https://github.com/FiloSottile/age | none resolved |
| databases | https://www.postgresql.org/docs/ , https://patroni.readthedocs.io/ , https://pgbackrest.org/ , https://cloudnative-pg.io/documentation/ | none resolved |

URLs not marked [F] are canonical project doc roots from general knowledge, not fetched in this session: verify before the skill author relies on a deep link.

---

## 4. Project detection for `devops-expert`

Existing routing (`rules/01-project-detection.md`) has no infra rows; `Dockerfile`/`.github/workflows/` appear in nearly every app repo. Proposed policy:

**Strong indicators (any one activates devops-expert as the primary agent):** `*.tf` / `.terraform.lock.hcl` / `terragrunt.hcl`; `Chart.yaml`; `kustomization.yaml` / `kustomization.yml`; `ansible.cfg`, `playbooks/`, `roles/`, `inventory/`, `galaxy.yml`, `requirements.yml` with collections; `*.pkr.hcl`; `.sops.yaml`; Flux `flux-system/` or Argo CD `Application`/`ApplicationSet` manifests; Prometheus/Alertmanager/Loki configs (`prometheus.yml`, `alertmanager.yml`, `loki-config.yaml`, `alloy` configs); Kolla/OSA layout (`globals.yml`, `passwords.yml`, `openstack_user_config.yml`); Talos machine configs; `nftables.conf`; Proxmox API usage (`pvesh`, `qm`, `pct`, `/etc/pve`); `Vagrantfile`.
**Weak indicators (never activate alone; count only with a strong one or an explicit user request):** `Dockerfile`, `.dockerignore`, `compose.yaml` / `docker-compose.yml`, `.github/workflows/`, `.gitlab-ci.yml`, `Makefile`, `scripts/*.sh`.
**Rule:** two or more weak indicators in a repo with NO framework config matched by `01-project-detection` (no `next.config.*`, `composer.json`, `go.mod`, ...) may activate devops-expert; a repo that matches a stack agent keeps the stack agent as primary and devops-expert is invoked only for the infra files (Dockerfile, compose, CI), when the task touches them.
**False-activation risk:** high for `Dockerfile` + `.github/workflows/` in app repos (the dominant case). Mitigations: weak/strong split above; stack agent precedence; activation also keyed on user intent words (deploy, cluster, VM, backup, terraform, helm, proxmox, openstack). File names above are well-known conventions but were not re-verified against a source this session.

---

## 5. Safety rules a devops agent must carry

Each rule is tied to a source read this session where one exists. Sources are command references, not "best-practice pages"; I found no single official safety checklist.

1. **Plan before apply, re-check the final plan.** Terraform: `plan` is a preview; a speculative plan may differ at apply time because other changes happen meanwhile, so re-check the final plan; save with `-out=FILE` and apply that file in automation [F] https://developer.hashicorp.com/terraform/cli/commands/plan . Never run `terraform destroy`/`tofu destroy` or `apply` on prod without showing the plan summary (adds/changes/destroys) and getting the owner's explicit go; `-exclude` (OpenTofu 1.9+) and `-target` are exceptions to be named, not defaults [F] https://opentofu.org/ .
2. **Kubernetes: dry-run and diff first.** `kubectl apply --dry-run=server`; `kubectl diff -f` (exit 0 = no diff, 1 = differences, >1 error) [F] https://kubernetes.io/docs/reference/kubectl/generated/kubectl_diff/ . `kubectl apply --prune` is documented as alpha and incomplete: do not use it [F] https://kubernetes.io/docs/reference/kubectl/generated/kubectl_apply/ . `--force` bypasses graceful deletion and may cause inconsistency or data loss (same page). Confirm the context (`kubectl config current-context`) and namespace before any `delete`; never `delete` namespaces, PVs, PVCs or CRDs without a stated blast radius.
3. **ZFS: dry-run every destroy.** `zfs destroy -nv` shows what would go; `-r` and `-R` can destroy large portions of a pool and affect mounted file systems; a snapshot with clones or holds fails by default [F] https://openzfs.github.io/openzfs-docs/man/master/8/zfs-destroy.8.html . Require a fresh snapshot or verified backup first.
4. **Proxmox: no `qm destroy` / `pct destroy` / storage removal without verified backup and VMID confirmation.** `qm` reference exists [F] https://pve.proxmox.com/pve-docs/qm.1.html ; the exact `destroy` purge/skiplock semantics were **not read** — the skill author must read them before writing the rule text. Check HA resources and backup jobs reference the VMID before removal. Do not leave quorum/cluster operations (`pvecm`) to improvisation.
5. **Docker firewall.** Do not edit Docker's nftables tables directly (changes are lost); disabling `iptables`/`ip6tables` daemon options likely breaks container networking; nftables backend is experimental and unsupported in Swarm [F] https://docs.docker.com/engine/network/firewall-nftables/ . Avoid `docker system prune -a --volumes`/`docker volume rm` on hosts with data volumes without listing what is removed.
6. **Production SSH access.** Read-only first (inspect, `systemctl status`, logs) before mutating; never run multi-host loops without a dry run and a one-host canary; take a snapshot/backup before change; no changes to `sshd`/firewall/network config over the same connection without a timed rollback (`at`, `nft` revert timer, or console access). These are operational practice, **not sourced** from an official page I read.
7. **Backups before change and restore tests.** Every destructive or irreversible step is preceded by a verified backup; backups count only after a restore test (PBS verify jobs and S3/encryption options exist [F] PBS roadmap page). The agent must log evidence of the restore test.
8. **Secrets.** Never print, commit or paste secrets; use SOPS/age, Vault/OpenBao or External Secrets; Kubernetes Secrets are base64, not encryption (general knowledge, not sourced). Private keys never leave the host; redact before quoting logs.
9. **Idempotence and scope.** Ansible: `--check --diff` and `--limit` before a wide run. Helm: `helm diff` plugin / `--dry-run`. GitOps: change via the repo, not by hand-editing live objects; pruning options need explicit owner approval. (General practice, not sourced here.)
10. **Version discipline.** Read the target version at the source before advising (Section 2 shows versions move fast: Terraform 1.15 EOL 2026-10-21, Argo CD 3.3 EOL 2026-11-04, Debian 11 and PVE 8 already EOL). Never recommend an EOL line without flagging it.

---

## 6. Not verified

- Exa unavailable (HTTP 401 on every call): no Exa confirmation for any claim. Cross-checks used GitHub API and endoflife.date. Items with a single source: Grafana 13.3.0 [E only]; Kubernetes patch versions [E] (official releases page snapshot was older: 1.37.1/1.36.5); Docker Compose, BuildKit (partially), Helm, Flux, Loki, Alertmanager, Alloy, OTel, Vault, OpenBao, SOPS, Traefik, Caddy, restic, cosign, Packer, cloud-init, Cilium, Incus, Talos, etcd, ESO, Gateway API, wireguard-tools [G only].
- Helm 4.x status relative to Helm 3 maintenance; Vault license terms; Rocky/Alma releases; borg, age versions; nftables tool version; PDM version.
- Kolla-Ansible and OpenStack-Ansible current versions/branches for 2026.2; OpenStack admin guide table of contents; Proxmox admin guide table of contents.
- roadmap.sh node tree; CNCF Trail Map stages; CKS/CKAD domain weights; CKA/CKAD v1.37 PDF contents.
- Kubernetes 1.37 deprecation detail (release blog says 1 deprecation/removal; details beyond the intro not read).
- Proxmox `qm destroy` option semantics; Proxmox/Terraform provider choice and versions (no provider checked).
- All PostgreSQL/MariaDB/Patroni/pgBackRest/CloudNativePG versions.
- Context7 IDs for: Terraform, Prometheus, Grafana, Loki, Argo CD, Flux, Helm, Traefik, Caddy, Cilium, Ceph, Vault/OpenBao, SOPS, GitHub Actions, GitLab.
- Project-detection file names and operational safety practices marked "not sourced" are conventions from general knowledge.

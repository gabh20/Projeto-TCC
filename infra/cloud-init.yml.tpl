#cloud-config
package_update: true
packages:
  - ca-certificates
  - curl
  - git
  - openssl

write_files:
  - path: /opt/tcc/README.txt
    permissions: "0644"
    content: |
      Host preparado pelo Terraform.
      O deploy da aplicacao deve ser feito pelo GitHub Actions via SSH.

runcmd:
  - curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  - sh /tmp/get-docker.sh
  - systemctl enable --now docker
  - usermod -aG docker ${ssh_username} || true
  - mkdir -p /opt/tcc
  - chown -R ${ssh_username}:${ssh_username} /opt/tcc

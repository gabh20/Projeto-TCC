output "instance_public_ip" {
  description = "IP publico da VM"
  value       = oci_core_instance.app_instance.public_ip
}

output "application_url" {
  description = "URL HTTP da aplicacao"
  value       = "http://${oci_core_instance.app_instance.public_ip}"
}

output "ssh_command" {
  description = "Comando base para acessar a VM"
  value       = "ssh ${var.ssh_username}@${oci_core_instance.app_instance.public_ip}"
}

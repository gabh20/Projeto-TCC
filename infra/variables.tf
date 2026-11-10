variable "tenancy_ocid" {
  description = "OCID do tenancy OCI"
  type        = string
  sensitive   = true
}

variable "user_ocid" {
  description = "OCID do usuário OCI"
  type        = string
  default     = ""
  sensitive   = true
}

variable "fingerprint" {
  description = "Fingerprint da chave de API (apenas para autenticação local)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "private_key_path" {
  description = "Caminho para a chave privada PEM (apenas para autenticação local)"
  type        = string
  default     = "~/.oci/oci_api_key.pem"
}

variable "region" {
  description = "Região da OCI (ex: us-ashburn-1, sa-saopaulo-1)"
  type        = string
  default     = "sa-saopaulo-1"
}

variable "compartment_id" {
  description = "OCID do compartment onde os recursos serão criados"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Prefixo usado nos nomes dos recursos OCI"
  type        = string
  default     = "tcc-app"
}

variable "availability_domain" {
  description = "Availability_domain de onde a instância vai estar"
  type        = string
}

variable "ssh_public_key_path" {
  description = "Caminho para a chave publica SSH autorizada na VM"
  type        = string
}

variable "ssh_username" {
  description = "Usuario padrao da imagem usada para acesso SSH"
  type        = string
  default     = "ubuntu"
}

variable "ssh_ingress_cidr" {
  description = "CIDR autorizado a acessar SSH. Use seu IP publico com /32"
  type        = string
}

variable "instance_display_name" {
  description = "Nome da instancia da aplicacao"
  type        = string
  default     = "tcc-app"
}

variable "instance_shape" {
  description = "Shape Always Free. Prefira VM.Standard.A1.Flex; use VM.Standard.E2.1.Micro se nao houver capacidade A1"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "instance_ocpus" {
  description = "OCPUs para VM.Standard.A1.Flex dentro do limite gratuito"
  type        = number
  default     = 2
}

variable "instance_memory_in_gbs" {
  description = "Memoria para VM.Standard.A1.Flex dentro do limite gratuito"
  type        = number
  default     = 12
}

variable "image_id" {
  description = "OCID de imagem opcional. Se vazio, busca uma imagem Ubuntu compativel com o shape"
  type        = string
  default     = ""
}

variable "image_operating_system" {
  description = "Sistema operacional usado na busca da imagem"
  type        = string
  default     = "Canonical Ubuntu"
}

variable "image_operating_system_version" {
  description = "Versao do sistema operacional usada na busca da imagem"
  type        = string
  default     = "24.04"
}

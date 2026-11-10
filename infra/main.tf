locals {
  cloud_init = templatefile("${path.module}/cloud-init.yml.tpl", {
    ssh_username = var.ssh_username
  })

  selected_image_id = var.image_id != "" ? var.image_id : data.oci_core_images.ubuntu.images[0].id
}

# ================================IMAGES================================

data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_id
  operating_system         = var.image_operating_system
  operating_system_version = var.image_operating_system_version
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# ================================COMPARTMENTS================================

resource "oci_identity_compartment" "app_compartment" {
  compartment_id = var.compartment_id
  description    = "Compartimento dos recursos do projeto TCC"
  name           = var.project_name
}

# ================================VCN================================

resource "oci_core_vcn" "vcn" {
  cidr_block     = "10.0.0.0/16"
  dns_label      = "vcn"
  compartment_id = oci_identity_compartment.app_compartment.id
  display_name   = "${var.project_name}-vcn"
}

# ================================GATEWAYS================================

resource "oci_core_internet_gateway" "internet_gateway" {
  compartment_id = oci_identity_compartment.app_compartment.id
  vcn_id         = oci_core_vcn.vcn.id
  enabled        = true
  display_name   = "${var.project_name}-igw"
}

# ================================ROUTE TABLES================================

resource "oci_core_route_table" "public_route_table" {
  compartment_id = oci_identity_compartment.app_compartment.id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.project_name}-public-rt"

  route_rules {
    network_entity_id = oci_core_internet_gateway.internet_gateway.id
    destination       = "0.0.0.0/0"
  }
}

# ================================SECURITY LISTS================================

resource "oci_core_security_list" "public_security_list" {
  compartment_id = oci_identity_compartment.app_compartment.id
  vcn_id         = oci_core_vcn.vcn.id
  display_name   = "${var.project_name}-public-sl"

  egress_security_rules {
    destination = "0.0.0.0/0"
    protocol    = "all"
  }

  ingress_security_rules {
    protocol = "6"
    source   = var.ssh_ingress_cidr

    tcp_options {
      min = 22
      max = 22
    }
  }
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"

    tcp_options {
      min = 80
      max = 80
    }
  }
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"

    tcp_options {
      min = 443
      max = 443
    }
  }
}

# ================================SUBNETS================================

resource "oci_core_subnet" "public_subnet" {
  compartment_id             = oci_identity_compartment.app_compartment.id
  vcn_id                     = oci_core_vcn.vcn.id
  cidr_block                 = "10.0.1.0/24"
  display_name               = "${var.project_name}-public-subnet"
  dns_label                  = "publicsubnet"
  prohibit_internet_ingress  = false
  prohibit_public_ip_on_vnic = false
  route_table_id             = oci_core_route_table.public_route_table.id
  security_list_ids          = [oci_core_security_list.public_security_list.id]
}

# ================================INSTANCES================================

resource "oci_core_instance" "app_instance" {

  availability_domain = var.availability_domain
  compartment_id      = oci_identity_compartment.app_compartment.id
  shape               = var.instance_shape
  display_name        = var.instance_display_name

  dynamic "shape_config" {
    for_each = endswith(var.instance_shape, ".Flex") ? [1] : []

    content {
      ocpus         = var.instance_ocpus
      memory_in_gbs = var.instance_memory_in_gbs
    }
  }

  create_vnic_details {
    assign_public_ip = true
    display_name     = "${var.project_name}-vnic"
    subnet_id        = oci_core_subnet.public_subnet.id
  }

  metadata = {
    ssh_authorized_keys = file(var.ssh_public_key_path)
    user_data           = base64encode(local.cloud_init)
  }

  source_details {
    source_type = "image"
    source_id   = local.selected_image_id
  }

  preserve_boot_volume = false

}

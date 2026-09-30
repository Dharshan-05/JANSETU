terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  type        = string
  description = "Google Cloud Project ID"
  default     = "jansetu-gov-ai"
}

variable "region" {
  type        = string
  description = "Google Cloud Region"
  default     = "asia-south1" # Mumbai, India
}

resource "google_bigquery_dataset" "jansetu_intel" {
  dataset_id                  = "jansetu_intel"
  friendly_name               = "JANSETU Civic Infrastructure Intelligence Grid"
  description                 = "Analytical data warehouse and vector search datastore for Pan-India civic intelligence."
  location                    = var.region
  default_table_expiration_ms = null

  labels = {
    env       = "production"
    dpg_layer = "civic_digital_twin"
  }
}

resource "google_storage_bucket" "citizen_audio" {
  name          = "${var.project_id}-citizen-audio"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
    }
  }
}

resource "google_pubsub_topic" "citizen_requests_raw" {
  name = "citizen-requests-raw"
}

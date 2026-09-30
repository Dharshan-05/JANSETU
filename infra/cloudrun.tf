resource "google_cloud_run_v2_service" "jansetu_backend" {
  name     = "jansetu-core-service"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 100
    }

    containers {
      image = "gcr.io/${var.project_id}/jansetu-backend:latest"

      resources {
        limits = {
          cpu    = "2000m"
          memory = "2Gi"
        }
      }

      env {
        name  = "ENVIRONMENT"
        value = "production"
      }
      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }
      env {
        name  = "BIGQUERY_DATASET"
        value = google_bigquery_dataset.jansetu_intel.dataset_id
      }
      env {
        name  = "BIGQUERY_USE_MOCK"
        value = "false"
      }
      env {
        name  = "PUBSUB_TOPIC"
        value = google_pubsub_topic.citizen_requests_raw.name
      }
      env {
        name  = "PUBSUB_USE_MOCK"
        value = "false"
      }
      env {
        name  = "GCS_BUCKET"
        value = google_storage_bucket.citizen_audio.name
      }
      env {
        name  = "GCS_USE_MOCK"
        value = "false"
      }
      env {
        name  = "FIREBASE_PROJECT_ID"
        value = var.project_id
      }
    }
  }
}

resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.jansetu_backend.location
  service  = google_cloud_run_v2_service.jansetu_backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

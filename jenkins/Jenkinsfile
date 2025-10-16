pipeline {
  agent any
  environment {
    IMAGE = "banking-api:ci"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Build') {
      steps {
        sh 'docker build -t $IMAGE ./api'
      }
    }
    stage('Test') {
      steps {
        sh 'echo "Add tests here"'
      }
    }
    stage('Deploy') {
      steps {
        sh 'docker tag $IMAGE banking-api:local || true'
        sh 'docker-compose up -d --no-deps --build api'
      }
    }
  }
}

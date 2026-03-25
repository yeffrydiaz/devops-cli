package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

const ServiceName = "{{SERVICE_NAME}}"

func getPort() string {
	port := os.Getenv("PORT")
	if port == "" {
		port = "{{SERVICE_PORT}}"
	}
	return port
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": ServiceName,
	})
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": fmt.Sprintf("Welcome to %s", ServiceName),
	})
}

func main() {
	port := getPort()
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/", indexHandler)
	fmt.Printf("%s listening on port %s\n", ServiceName, port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
		os.Exit(1)
	}
}

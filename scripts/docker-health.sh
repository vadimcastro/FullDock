#!/bin/bash

# docker-health.sh - Universal Docker Health Check Functions for vadimOS
# Location: /Users/vadimcastro/Desktop/PROJECTS/vadimOS/docker-health.sh
# Purpose: Provide universal Docker health checking across all vadimOS projects

# Color codes for consistent output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Health check timeout (seconds)
HEALTH_TIMEOUT=60

# Check if Docker is installed
check_docker_installed() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo -e "${YELLOW}💡 Install Docker Desktop: https://www.docker.com/products/docker-desktop${NC}"
        return 1
    fi
    return 0
}

# Check if Docker daemon is running
check_docker_running() {
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo -e "${YELLOW}💡 Start Docker Desktop application${NC}"
        return 1
    fi
    return 0
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not available${NC}"
        echo -e "${YELLOW}💡 Ensure Docker Desktop is running or install Docker Compose${NC}"
        return 1
    fi
    return 0
}

# Check if a specific port is responding
check_port_ready() {
    local port="$1"
    local timeout="${2:-30}"
    local silent="${3:-false}"
    local count=0
    
    while ! curl -s "http://localhost:$port" >/dev/null 2>&1; do
        if [ $count -ge $timeout ]; then
            if [ "$silent" != "true" ]; then
                echo -e "${RED}❌ Port $port not responding after ${timeout}s${NC}"
            fi
            return 1
        fi
        sleep 1
        count=$((count + 1))
    done
    
    if [ "$silent" != "true" ]; then
        echo -e "${GREEN}✅ Port $port is ready${NC}"
    fi
    return 0
}

# Check if specific service is ready
check_service_ready() {
    local service_name="$1"
    local port="$2"
    local timeout="${3:-30}"
    local silent="${4:-false}"
    
    if [ "$silent" != "true" ]; then
        echo -e "${BLUE}🔍 Checking $service_name on port $port...${NC}"
    fi
    
    if check_port_ready "$port" "$timeout" "$silent"; then
        if [ "$silent" != "true" ]; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
        fi
        return 0
    else
        if [ "$silent" != "true" ]; then
            echo -e "${RED}❌ $service_name failed to start${NC}"
        fi
        return 1
    fi
}

# Comprehensive Docker health check
health_docker() {
    echo -e "${BLUE}🏥 vadimOS Docker Health Check${NC}"
    echo "================================"
    
    local all_checks_passed=true
    
    # Check Docker installation
    if check_docker_installed; then
        echo -e "${GREEN}✅ Docker is installed${NC}"
    else
        all_checks_passed=false
    fi
    
    # Check Docker daemon
    if check_docker_running; then
        echo -e "${GREEN}✅ Docker daemon is running${NC}"
    else
        all_checks_passed=false
    fi
    
    # Check Docker Compose
    if check_docker_compose; then
        echo -e "${GREEN}✅ Docker Compose is available${NC}"
    else
        all_checks_passed=false
    fi
    
    # Show Docker info if available
    if docker info &> /dev/null; then
        echo -e "${BLUE}📊 Docker Status:${NC}"
        echo "  Version: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
        echo "  Containers: $(docker ps -q | wc -l | tr -d ' ') running"
        echo "  Images: $(docker images -q | wc -l | tr -d ' ') total"
    fi
    
    echo "================================"
    
    if $all_checks_passed; then
        echo -e "${GREEN}✅ All Docker health checks passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Some Docker health checks failed${NC}"
        return 1
    fi
}

# Check container health
health_containers() {
    echo -e "${BLUE}🐳 Container Health Check${NC}"
    echo "=========================="
    
    local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")
    
    if [ -z "$containers" ] || [ "$containers" = "NAMES	STATUS	PORTS" ]; then
        echo -e "${YELLOW}⚠️  No running containers found${NC}"
        return 1
    fi
    
    echo "$containers"
    echo "=========================="
    echo -e "${GREEN}✅ Container status displayed${NC}"
    return 0
}

# Check API health (frontend/backend)
health_api() {
    echo -e "${BLUE}🌐 API Health Check${NC}"
    echo "==================="
    
    local api_healthy=true
    
    # Check common development ports
    local ports=(3000 8000 5432 6379)
    local port_names=("Frontend" "Backend" "Database" "Cache")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}
        
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name (port $port) is responding${NC}"
        else
            echo -e "${YELLOW}⚠️  $name (port $port) is not responding${NC}"
            api_healthy=false
        fi
    done
    
    echo "==================="
    
    if $api_healthy; then
        echo -e "${GREEN}✅ API health check completed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Some services are not responding${NC}"
        return 1
    fi
}

# Comprehensive health check
health_check() {
    echo -e "${BLUE}🏥 vadimOS Complete Health Check${NC}"
    echo "===================================="
    
    local overall_health=true
    
    # Run all health checks
    if ! health_docker; then
        overall_health=false
    fi
    
    echo ""
    
    if ! health_containers; then
        overall_health=false
    fi
    
    echo ""
    
    if ! health_api; then
        overall_health=false
    fi
    
    echo "===================================="
    
    if $overall_health; then
        echo -e "${GREEN}🎉 All systems are healthy!${NC}"
        return 0
    else
        echo -e "${RED}⚠️  Some systems need attention${NC}"
        return 1
    fi
}

# Wait for services to be ready before opening browser
wait_for_services() {
    local frontend_port="${1:-3000}"
    local backend_port="${2:-8000}"
    local silent="${3:-false}"
    
    if [ "$silent" != "true" ]; then
        echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    fi
    
    # Check Docker first (skip in silent mode for browser checks)
    if [ "$silent" != "true" ]; then
        if ! health_docker >/dev/null 2>&1; then
            echo -e "${RED}❌ Docker is not ready${NC}"
            return 1
        fi
    fi
    
    # In silent mode, just check ports directly without verbose output
    if [ "$silent" = "true" ]; then
        # Simple port checks without output
        local backend_ready=true
        local frontend_ready=true
        
        # Check backend port if provided
        if [ -n "$backend_port" ] && [ "$backend_port" != "skip" ]; then
            if ! curl -s "http://localhost:$backend_port" >/dev/null 2>&1; then
                backend_ready=false
            fi
        fi
        
        # Check frontend port
        if ! curl -s "http://localhost:$frontend_port" >/dev/null 2>&1; then
            frontend_ready=false
        fi
        
        # Return success only if frontend is ready (backend is optional)
        if [ "$frontend_ready" = "true" ]; then
            return 0
        else
            return 1
        fi
    else
        # Non-silent mode: use verbose checks
        # Wait for backend (if provided)
        if [ -n "$backend_port" ] && [ "$backend_port" != "skip" ]; then
            if ! check_service_ready "Backend" "$backend_port" 30 "$silent"; then
                echo -e "${YELLOW}⚠️  Backend not ready, continuing...${NC}"
            fi
        fi
        
        # Wait for frontend
        if ! check_service_ready "Frontend" "$frontend_port" 45 "$silent"; then
            echo -e "${RED}❌ Frontend not ready${NC}"
            return 1
        fi
        
        echo -e "${GREEN}✅ Services are ready for browser${NC}"
        return 0
    fi
}

# Functions are available after sourcing this script
# No need to export since we're sourcing, not executing in subshells
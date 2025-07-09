# app/crud/crud_metrics.py
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta
from typing import Dict, List
import psutil
import platform
import subprocess
import os
from app.models.user import User
from app.models.user_session import UserSession

def get_visitor_metrics(db: Session) -> Dict:
    """Get visitor metrics with month-over-month comparison"""
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    # Get unique visitors (users with sessions) for current month
    current_visitors = db.query(func.count(func.distinct(UserSession.user_id))).filter(
        UserSession.created_at >= current_month_start
    ).scalar() or 0
    
    # Get unique visitors from last month
    last_month_visitors = db.query(func.count(func.distinct(UserSession.user_id))).filter(
        UserSession.created_at >= last_month_start,
        UserSession.created_at < current_month_start
    ).scalar() or 0
    
    percentage_change = (
        ((current_visitors - last_month_visitors) / last_month_visitors * 100)
        if last_month_visitors > 0 else 
        100 if current_visitors > 0 else 0
    )
    
    return {
        "total": current_visitors,
        "percentageChange": round(percentage_change, 1),
        "lastMonthTotal": last_month_visitors
    }

def get_session_metrics(db: Session) -> Dict:
    """Get active session metrics with hourly comparison"""
    now = datetime.now()
    active_cutoff = now - timedelta(minutes=15)  # Sessions active in last 15 minutes
    previous_hour = now - timedelta(hours=1)
    
    # Get current active sessions
    active_sessions = db.query(func.count(func.distinct(UserSession.user_id))).filter(
        UserSession.last_activity >= active_cutoff
    ).scalar() or 0
    
    # Get active sessions from previous hour for comparison
    previous_hour_sessions = db.query(func.count(func.distinct(UserSession.user_id))).filter(
        UserSession.last_activity >= previous_hour,
        UserSession.last_activity < active_cutoff
    ).scalar() or 0
    
    percentage_change = (
        ((active_sessions - previous_hour_sessions) / previous_hour_sessions * 100)
        if previous_hour_sessions > 0 else 
        100 if active_sessions > 0 else 0
    )
    
    # Get total sessions today
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    total_today = db.query(func.count(func.distinct(UserSession.user_id))).filter(
        UserSession.created_at >= today_start
    ).scalar() or 0
    
    return {
        "active": active_sessions,
        "percentageChange": round(percentage_change, 1),
        "previousHourActive": previous_hour_sessions,
        "totalToday": total_today
    }

def get_user_metrics(db: Session) -> Dict:
    """Get user registration metrics"""
    current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
    
    # Get total active users
    total_users = db.query(func.count(User.id)).filter(
        User.is_active == True
    ).scalar() or 0
    
    # Get new users this month
    new_users = db.query(func.count(User.id)).filter(
        User.created_at >= current_month_start,
        User.is_active == True
    ).scalar() or 0
    
    # Get new users last month
    last_month_users = db.query(func.count(User.id)).filter(
        User.created_at >= last_month_start,
        User.created_at < current_month_start,
        User.is_active == True
    ).scalar() or 0
    
    percentage_change = (
        ((new_users - last_month_users) / last_month_users * 100)
        if last_month_users > 0 else 
        100 if new_users > 0 else 0
    )
    
    return {
        "total": total_users,
        "newThisMonth": new_users,
        "percentageChange": round(percentage_change, 1),
        "lastMonthNew": last_month_users
    }

def get_recent_activity(db: Session, limit: int = 5) -> List[Dict]:
    """Get recent activity across all types"""
    # Get recent sessions
    recent_sessions = db.query(
        UserSession.user_id,
        User.username,
        User.email,
        UserSession.created_at
    ).join(
        User, User.id == UserSession.user_id
    ).order_by(
        UserSession.created_at.desc()
    ).limit(limit).all()
    
    # Format activities
    activities = []
    
    for session in recent_sessions:
        activities.append({
            "type": "session",
            "username": session.username,
            "email": session.email,
            "timestamp": session.created_at,
            "description": f"User logged in"
        })
    
    # Sort activities by timestamp
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]



def get_system_metrics() -> Dict:
    """Get system metrics"""
    try:
        # CPU Usage
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_count = psutil.cpu_count()
        
        # Memory Usage
        memory = psutil.virtual_memory()
        memory_used_gb = round(memory.used / (1024**3), 2)
        memory_total_gb = round(memory.total / (1024**3), 2)
        memory_percent = round(memory.percent, 1)
        
        # Disk Usage
        disk = psutil.disk_usage('/')
        disk_used_gb = round(disk.used / (1024**3), 2)
        disk_total_gb = round(disk.total / (1024**3), 2)
        disk_percent = round((disk.used / disk.total) * 100, 1)
        
        # Load Average (Linux/Unix only)
        load_avg = None
        if hasattr(os, 'getloadavg'):
            load_avg = os.getloadavg()
        
        # Docker Container Status
        docker_status = get_docker_status()
        
        return {
            "cpu": {
                "usage_percent": cpu_percent,
                "cores": cpu_count,
                "load_average": list(load_avg) if load_avg else None
            },
            "memory": {
                "used_gb": memory_used_gb,
                "total_gb": memory_total_gb,
                "usage_percent": memory_percent,
                "available_gb": round(memory.available / (1024**3), 2)
            },
            "disk": {
                "used_gb": disk_used_gb,
                "total_gb": disk_total_gb,
                "usage_percent": disk_percent,
                "free_gb": round(disk.free / (1024**3), 2)
            },
            "docker": docker_status,
            "platform": {
                "system": platform.system(),
                "release": platform.release(),
                "machine": platform.machine()
            }
        }
    except Exception as e:
        return {"error": str(e)}

def get_docker_status() -> Dict:
    """Get Docker container status"""
    try:
        # Get container status
        result = subprocess.run(
            ['docker', 'ps', '--format', 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[1:]  # Skip header
            containers = []
            
            for line in lines:
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        containers.append({
                            "name": parts[0],
                            "status": parts[1],
                            "ports": parts[2] if len(parts) > 2 else ""
                        })
            
            return {
                "containers": containers,
                "total_running": len(containers)
            }
        else:
            return {"error": "Docker command failed"}
            
    except subprocess.TimeoutExpired:
        return {"error": "Docker command timeout"}
    except FileNotFoundError:
        return {"error": "Docker not found"}
    except Exception as e:
        return {"error": str(e)}

def get_network_metrics() -> Dict:
    """Get network usage metrics"""
    try:
        # Network I/O
        net_io = psutil.net_io_counters()
        
        # Network connections
        connections = psutil.net_connections(kind='inet')
        active_connections = len([c for c in connections if c.status == 'ESTABLISHED'])
        
        return {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv,
            "active_connections": active_connections,
            "total_connections": len(connections)
        }
    except Exception as e:
        return {"error": str(e)}

def get_application_health() -> Dict:
    """Get application health metrics"""
    try:
        # Process info for current Python process
        process = psutil.Process()
        
        # Memory usage of this process
        memory_info = process.memory_info()
        memory_mb = round(memory_info.rss / (1024**2), 2)
        
        # CPU usage of this process
        cpu_percent = process.cpu_percent()
        
        # Process uptime
        create_time = datetime.fromtimestamp(process.create_time())
        uptime = datetime.now() - create_time
        
        # Thread count
        thread_count = process.num_threads()
        
        return {
            "memory_usage_mb": memory_mb,
            "cpu_percent": cpu_percent,
            "uptime_seconds": int(uptime.total_seconds()),
            "uptime_human": str(uptime).split('.')[0],  # Remove microseconds
            "thread_count": thread_count,
            "status": "healthy"
        }
    except Exception as e:
        return {"error": str(e), "status": "unhealthy"}

def get_deployment_info() -> Dict:
    """Get current deployment and git information"""
    try:
        deployment_info = {}
        
        # Get git information from environment variables (set during Docker build)
        deployment_info["current_branch"] = os.getenv("GIT_BRANCH", "unknown")
        deployment_info["commit_hash"] = os.getenv("GIT_COMMIT_HASH", "unknown")
        deployment_info["commit_message"] = os.getenv("GIT_COMMIT_MESSAGE", "unknown") 
        deployment_info["commit_date"] = os.getenv("GIT_COMMIT_DATE", "unknown")
        
        # Ensure commit_hash is shortened to 8 characters if it's a full hash
        if deployment_info["commit_hash"] != "unknown" and len(deployment_info["commit_hash"]) > 8:
            deployment_info["commit_hash"] = deployment_info["commit_hash"][:8]
        
        # Get environment info
        deployment_info["environment"] = os.getenv("ENVIRONMENT", "unknown")
        deployment_info["deploy_time"] = datetime.now().isoformat()
        
        return deployment_info
        
    except Exception as e:
        return {"error": str(e)}

def get_disk_metrics() -> Dict:
    """Get detailed disk usage metrics with cleanup benefits tracking"""
    try:
        # Main disk usage
        disk = psutil.disk_usage('/')
        disk_used_gb = round(disk.used / (1024**3), 2)
        disk_total_gb = round(disk.total / (1024**3), 2)
        disk_free_gb = round(disk.free / (1024**3), 2)
        disk_percent = round((disk.used / disk.total) * 100, 1)
        
        # Docker system usage
        docker_info = {}
        try:
            result = subprocess.run(
                ['docker', 'system', 'df', '--format', 'json'],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode == 0:
                import json
                docker_data = json.loads(result.stdout)
                
                # Calculate total Docker usage
                total_docker_gb = 0
                for item in docker_data:
                    if 'Size' in item:
                        # Parse size string (e.g., "1.2GB" -> 1.2)
                        size_str = item['Size']
                        if 'GB' in size_str:
                            total_docker_gb += float(size_str.replace('GB', ''))
                        elif 'MB' in size_str:
                            total_docker_gb += float(size_str.replace('MB', '')) / 1024
                
                docker_info = {
                    "total_size_gb": round(total_docker_gb, 2),
                    "percentage_of_disk": round((total_docker_gb / disk_total_gb) * 100, 1)
                }
        except:
            docker_info = {"total_size_gb": 0, "percentage_of_disk": 0}
        
        # Cleanup potential calculation
        cleanup_potential = {
            "logs_cleanup_mb": 50,  # Estimated log cleanup
            "docker_cache_gb": round(docker_info.get("total_size_gb", 0) * 0.3, 2),  # 30% of Docker can be cache
            "package_cache_mb": 100,  # APT cache
            "total_potential_gb": round((50 + 100) / 1024 + docker_info.get("total_size_gb", 0) * 0.3, 2)
        }
        
        return {
            "disk_used_gb": disk_used_gb,
            "disk_total_gb": disk_total_gb,
            "disk_free_gb": disk_free_gb,
            "disk_percent": disk_percent,
            "docker_usage": docker_info,
            "cleanup_potential": cleanup_potential,
            "health_status": "warning" if disk_percent > 80 else "good" if disk_percent < 60 else "caution"
        }
        
    except Exception as e:
        return {"error": str(e), "health_status": "error"}
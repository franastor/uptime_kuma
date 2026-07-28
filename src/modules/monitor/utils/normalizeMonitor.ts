import type {
  KumaMonitor,
  Monitor,
} from "@/src/modules/monitor/types/monitor";
  
  function getMonitorTarget(
    monitor: KumaMonitor,
  ): string | null {
    if (monitor.url) {
      return monitor.url;
    }
  
    if (monitor.hostname && monitor.port) {
      return `${monitor.hostname}:${monitor.port}`;
    }
  
    if (monitor.hostname) {
      return monitor.hostname;
    }
  
    return null;
  }
  
  export function normalizeMonitor(
    monitor: KumaMonitor,
  ): Monitor {
    return {

      id: monitor.id,
    
      name: monitor.name,
    
      type: monitor.type,
    
      target: getMonitorTarget(monitor),
    
      interval: monitor.interval ?? null,
    
      active: monitor.active ?? true,
    
      description: monitor.description ?? null,
    
      status: "unknown",
    
      ping: null,
    
      message: null,
    
      uptime: null,
    
      lastHeartbeatAt: null,
    
      duration: null,
    
      retries: 0,
    
      important: false,
    
      previousStatus: null,
    
    };
  }
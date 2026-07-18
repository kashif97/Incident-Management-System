import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const fmt = d => { if(!d) return '—'; try { return format(typeof d==='string'?parseISO(d):new Date(d),'dd MMM yyyy'); } catch{return String(d);} };
export const fmtDt = d => { if(!d) return '—'; try { return format(typeof d==='string'?parseISO(d):new Date(d),'dd MMM yyyy, HH:mm'); } catch{return String(d);} };
export const fmtAgo = d => { if(!d) return '—'; try { return formatDistanceToNow(typeof d==='string'?parseISO(d):new Date(d),{addSuffix:true}); } catch{return String(d);} };
export const fmtMins = m => { if(!m) return '—'; if(m<60) return `${m} min`; if(m<1440) return `${Math.floor(m/60)}h ${m%60?m%60+'m':''}`.trim(); return `${Math.floor(m/1440)}d ${Math.floor((m%1440)/60)}h`.trim(); };
export const initials = n => n ? n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase() : '?';
export const apiErr = e => e?.response?.data?.message || e?.message || 'Something went wrong';

export const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#dc2626','#d97706','#16a34a','#0891b2','#9d174d','#0e7490'];
export const avatarBg = name => { if(!name) return AVATAR_COLORS[0]; return AVATAR_COLORS[name.charCodeAt(0)%AVATAR_COLORS.length]; };

export const PRIORITIES  = ['LOW','MEDIUM','HIGH','CRITICAL'];
export const ALL_STATUSES = ['NEW','LOGGED','CATEGORIZED','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED','REOPENED','ESCALATED'];
export const DEPARTMENTS  = ['IT','HR','Finance','Operations','Sales','Marketing','Legal','Engineering','Support','Other'];

export const PRIORITY_META = {
  LOW:      { color:'#16a34a', bg:'#f0fdf4', icon:'🟢', desc:'Non-urgent, can wait',           sla:'Response: 8 hrs · Resolution: 48 hrs' },
  MEDIUM:   { color:'#d97706', bg:'#fffbeb', icon:'🟡', desc:'Moderate impact, handle today',  sla:'Response: 4 hrs · Resolution: 24 hrs' },
  HIGH:     { color:'#ea580c', bg:'#fff7ed', icon:'🟠', desc:'Significant disruption, urgent',  sla:'Response: 1 hr · Resolution: 8 hrs'  },
  CRITICAL: { color:'#dc2626', bg:'#fef2f2', icon:'🔴', desc:'Business-critical, act now!',     sla:'Response: 15 min · Resolution: 4 hrs' },
};

export const STATUS_LABEL = {
  NEW:'New', LOGGED:'Logged', CATEGORIZED:'Categorized',
  ASSIGNED:'Assigned', IN_PROGRESS:'In Progress',
  RESOLVED:'Resolved', CLOSED:'Closed', REOPENED:'Reopened', ESCALATED:'Escalated',
};

export const ROLE_LABEL = {
  ADMIN:'System Administrator',
  REPORTER:'End User / Reporter',
  RESOLVER:'Support Engineer (L2/L3)',
  INC_MANAGER:'Incident Manager',
};

export const STATUS_DOT = {
  NEW:'',LOGGED:'',CATEGORIZED:'purple',ASSIGNED:'',
  IN_PROGRESS:'',RESOLVED:'success',CLOSED:'muted',REOPENED:'warning',ESCALATED:'danger',
};

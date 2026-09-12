const baseline = {
  flow_duration: 2.5, header_length: 54, protocol_type: 6, duration: 64,
  rate: 25, srate: 20, drate: 5, fin_flag_number: 0, syn_flag_number: 1,
  rst_flag_number: 0, psh_flag_number: 1, ack_flag_number: 1, ece_flag_number: 0,
  cwr_flag_number: 0, ack_count: 2, syn_count: 3, fin_count: 0, urg_count: 0,
  rst_count: 0, http: 0, https: 1, dns: 0, telnet: 0, smtp: 0, ssh: 1,
  irc: 0, tcp: 1, udp: 0, dhcp: 0, arp: 0, icmp: 0, ipv: 1, llc: 0,
  tot_sum: 1000, min: 40, max: 500, avg: 180, std: 50, tot_size: 1200,
  iat: .5, number: 10, magnitude: 20, radius: 15, covariance: 5, variance: 25, weight: 1,
  failed_logins: 0, port_scans: 0, process_creation: 1, privilege_changes: 0,
  internal_connections: 2, outbound_bytes: 300,
  failed_logins_trend: 0, port_scans_trend: 0, process_creation_trend: 0,
  privilege_changes_trend: 0, internal_connections_trend: 0, outbound_bytes_trend: 0,
}
export const scenarios = [
  { id: 'normal', name: 'Quiet activity', description: 'Low behavioural indicators', data: { ...baseline } },
  { id: 'reconnaissance', name: 'Scanning activity', description: 'Ports scanned + failed logins', data: { ...baseline, port_scans: 25, failed_logins: 15, port_scans_trend: 10 } },
  { id: 'suspicious', name: 'Escalating activity', description: 'Privilege changes + internal traffic', data: { ...baseline, failed_logins: 20, process_creation: 18, privilege_changes: 8, internal_connections: 30, outbound_bytes: 20000, privilege_changes_trend: 5, internal_connections_trend: 12, outbound_bytes_trend: 10000 } },
]
export const indicators = [
  ['failed_logins', 'Failed logins', 'attempts'], ['port_scans', 'Ports scanned', 'ports'],
  ['process_creation', 'Processes created', 'events'], ['privilege_changes', 'Privilege changes', 'events'],
  ['internal_connections', 'Internal connections', 'connections'], ['outbound_bytes', 'Outbound data', 'bytes'],
]

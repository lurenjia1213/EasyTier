import { v4 as uuidv4 } from 'uuid'
import * as proto from '../gen/proto.js'
import type { Acl, AclRule, NetworkConfig } from '../types/network'

function cleanPeerUrls(urls: string[] | undefined): string[] {
  return (urls ?? []).map((url) => url.trim()).filter((url) => url.length > 0)
}

function normalizeAclRule(rule: AclRule): AclRule {
  return {
    ...rule,
    ports: rule.ports ?? [],
    source_ips: rule.source_ips ?? [],
    destination_ips: rule.destination_ips ?? [],
    source_ports: rule.source_ports ?? [],
    source_groups: rule.source_groups ?? [],
    destination_groups: rule.destination_groups ?? [],
  }
}

function normalizeAcl(acl: Acl | undefined): Acl | undefined {
  if (!acl) {
    return undefined
  }

  const aclV1 = acl.acl_v1 ?? { chains: [], group: { declares: [], members: [] } }
  return {
    ...acl,
    acl_v1: {
      ...aclV1,
      chains: (aclV1.chains ?? []).map((chain) => ({
        ...chain,
        rules: (chain.rules ?? []).map(normalizeAclRule),
      })),
      group: {
        ...aclV1.group,
        declares: aclV1.group?.declares ?? [],
        members: aclV1.group?.members ?? [],
      },
    },
  }
}

export function DEFAULT_NETWORK_CONFIG(): NetworkConfig {
  return {
    instance_id: uuidv4(),
    dhcp: true, virtual_ipv4: '', network_length: 24,
    network_name: 'easytier', network_secret: '', credential_file: '',
    networking_method: proto.api.manage.NetworkingMethod.Manual, public_server_url: '',
    peer_urls: [], proxy_cidrs: [],
    enable_vpn_portal: false, vpn_portal_listen_port: 22022,
    vpn_portal_client_network_addr: '', vpn_portal_client_network_len: 24,
    advanced_settings: false,
    listener_urls: ['tcp://0.0.0.0:11010', 'udp://0.0.0.0:11010', 'wg://0.0.0.0:11011'],
    latency_first: false, dev_name: '',
    use_smoltcp: false, disable_ipv6: false, ipv6_public_addr_auto: false,
    enable_kcp_proxy: false, disable_kcp_input: false,
    enable_quic_proxy: false, disable_quic_input: false,
    disable_p2p: false, p2p_only: false, lazy_p2p: false,
    bind_device: true, no_tun: false, enable_exit_node: false,
    relay_all_peer_rpc: false, need_p2p: false, multi_thread: true,
    proxy_forward_by_system: false, disable_encryption: false,
    disable_tcp_hole_punching: false, disable_udp_hole_punching: false,
    disable_upnp: false, enable_udp_broadcast_relay: false, disable_sym_hole_punching: false,
    enable_relay_network_whitelist: false, relay_network_whitelist: [],
    enable_manual_routes: false, routes: [], exit_nodes: [],
    enable_socks5: false, socks5_port: 1080,
    mtu: undefined, instance_recv_bps_limit: undefined,
    mapped_listeners: [],
    enable_magic_dns: false, enable_private_mode: false,
    port_forwards: [],
    acl: { acl_v1: { group: { declares: [], members: [] }, chains: [] } },
  }
}

export function normalizeManualNetworkConfig(config: NetworkConfig): NetworkConfig {
  const defaults = DEFAULT_NETWORK_CONFIG()
  return {
    ...defaults,
    ...config,
    networking_method: proto.api.manage.NetworkingMethod.Manual,
    public_server_url: '',
    peer_urls: cleanPeerUrls(config.peer_urls),
    proxy_cidrs: config.proxy_cidrs ?? [],
    listener_urls: config.listener_urls ?? [],
    relay_network_whitelist: config.relay_network_whitelist ?? [],
    routes: config.routes ?? [],
    exit_nodes: config.exit_nodes ?? [],
    mapped_listeners: config.mapped_listeners ?? [],
    port_forwards: config.port_forwards ?? [],
    acl: normalizeAcl(config.acl ?? defaults.acl),
  }
}

export const normalizeNetworkConfig = normalizeManualNetworkConfig

export function pbjsonSerializeNetworkConfig(config: NetworkConfig): any {
  const inst = proto.api.manage.NetworkConfig.fromObject(config)
  // Keep explicit empty repeated fields. The backend uses empty lists to clear
  // persisted values such as peer_urls when a network is saved or disabled.
  return proto.api.manage.NetworkConfig.toObject(inst, { enums: String, longs: String, defaults: false, arrays: true })
}

// Returns a JSON-compatible blob for backend consumption. The `any` return type
// is intentional because callers pass the result directly as an opaque request
// body to axios or Tauri invoke.
export function toBackendNetworkConfig(config: NetworkConfig): any {
  return pbjsonSerializeNetworkConfig(normalizeManualNetworkConfig(config))
}

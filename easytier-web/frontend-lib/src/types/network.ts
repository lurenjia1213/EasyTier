import * as proto from '../gen/proto.js'
import type Long from 'long'

// ==========================================================================
// 1. Proto-generated types — the single source of truth
// ==========================================================================
// pbts exposes optional fields as T|null|undefined.  The frontend model treats
// null the same as absent, so exported UI-facing aliases remove null.  Parsed
// pbjson also uses longs:Number, so Long-valued fields are exposed as numbers.
type FrontendProto<T> = T extends Long ? number
  : T extends (infer U)[] ? FrontendProto<U>[]
  : T extends object ? { [K in keyof T]: FrontendProto<NonNullable<T[K]>> }
  : NonNullable<T>

// --- api.manage ---
export type NetworkConfig = FrontendProto<proto.api.manage.NetworkConfig.$Properties>
export type PortForwardConfig = FrontendProto<proto.api.manage.PortForwardConfig.$Properties>
export type NetworkInstanceRunningInfo = FrontendProto<proto.api.manage.NetworkInstanceRunningInfo.$Properties>
export type MyNodeInfo = FrontendProto<proto.api.manage.MyNodeInfo.$Properties>
export type NodeInfo = MyNodeInfo

// --- common ---
export type SecureModeConfig = FrontendProto<proto.common.SecureModeConfig.$Properties>
export type Ipv4Addr = FrontendProto<proto.common.Ipv4Addr.$Properties>
export type Ipv4Inet = FrontendProto<proto.common.Ipv4Inet.$Properties>
export type Ipv6Addr = FrontendProto<proto.common.Ipv6Addr.$Properties>
export type Url = FrontendProto<proto.common.Url.$Properties>
export type StunInfo = FrontendProto<proto.common.StunInfo.$Properties>
export type TunnelInfo = FrontendProto<proto.common.TunnelInfo.$Properties>
export type PeerFeatureFlag = FrontendProto<proto.common.PeerFeatureFlag.$Properties>

// --- acl ---
export type AclRule = FrontendProto<proto.acl.Rule.$Properties>
export type AclChain = FrontendProto<proto.acl.Chain.$Properties>
export type AclV1 = FrontendProto<proto.acl.AclV1.$Properties>
export type Acl = FrontendProto<proto.acl.Acl.$Properties>
export type GroupInfo = FrontendProto<proto.acl.GroupInfo.$Properties>
export type GroupIdentity = FrontendProto<proto.acl.GroupIdentity.$Properties>

// --- api.instance ---
export type PeerConnStats = FrontendProto<proto.api.instance.PeerConnStats.$Properties>
export type PeerConnInfo = FrontendProto<proto.api.instance.PeerConnInfo.$Properties>
export type PeerInfo = FrontendProto<proto.api.instance.PeerInfo.$Properties>
export type Route = FrontendProto<proto.api.instance.Route.$Properties>
export type PeerRoutePair = FrontendProto<proto.api.instance.PeerRoutePair.$Properties>

// --- enums ---
export const NetworkingMethod = proto.api.manage.NetworkingMethod
export type NetworkingMethod = proto.api.manage.NetworkingMethod
export const NatType = proto.common.NatType
export type NatType = proto.common.NatType
export const AclProtocol = proto.acl.Protocol
export type AclProtocol = proto.acl.Protocol
export const AclAction = proto.acl.Action
export type AclAction = proto.acl.Action
export const AclChainType = proto.acl.ChainType
export type AclChainType = proto.acl.ChainType

// ==========================================================================
// 2. Pbjson conversion
// ==========================================================================

// Parse backend pbjson -> typed plain object.
// fromObject converts enum strings -> numbers; toObject converts int64 strings
// to numbers. NetworkConfig must preserve proto optional presence so a load/save
// roundtrip does not turn absent fields into explicit false/0/empty values.
function parsePreservingPresence(cls: any, json: any): any {
  return cls.toObject(cls.fromObject(json), { defaults: false, arrays: true, longs: Number })
}

// Runtime/status messages are easier for the UI to consume with proto3 scalar
// defaults filled in.
function parseWithDefaults(cls: any, json: any): any {
  return cls.toObject(cls.fromObject(json), { defaults: true, longs: Number })
}

export const pbjsonParseNetworkConfig = (json: any): NetworkConfig =>
  parsePreservingPresence(proto.api.manage.NetworkConfig, json) as NetworkConfig
export const pbjsonParseNetworkInstanceRunningInfo = (json: any): NetworkInstanceRunningInfo =>
  parseWithDefaults(proto.api.manage.NetworkInstanceRunningInfo, json) as NetworkInstanceRunningInfo
export const pbjsonParseNetworkMeta = (json: any): NetworkMeta =>
  parseWithDefaults(proto.api.manage.NetworkMeta, json) as NetworkMeta

// ==========================================================================
// 3. Helpers
// ==========================================================================

export function ensureAclRuleLists(rule: AclRule): AclRule {
  rule.ports ??= []
  rule.source_ips ??= []
  rule.destination_ips ??= []
  rule.source_ports ??= []
  rule.source_groups ??= []
  rule.destination_groups ??= []
  return rule
}

// ==========================================================================
// 4. Custom UI types (not from proto)
// ==========================================================================

export type NetworkMeta = FrontendProto<proto.api.manage.NetworkMeta.$Properties>

export interface NetworkInstance {
  instance_id: string; running: boolean; error_msg: string
  detail?: NetworkInstanceRunningInfo
}

export enum EventType {
  TunDeviceReady = 'TunDeviceReady', TunDeviceError = 'TunDeviceError',
  PeerAdded = 'PeerAdded', PeerRemoved = 'PeerRemoved',
  PeerConnAdded = 'PeerConnAdded', PeerConnRemoved = 'PeerConnRemoved',
  ListenerAdded = 'ListenerAdded', ListenerAddFailed = 'ListenerAddFailed',
  ListenerAcceptFailed = 'ListenerAcceptFailed', ConnectionAccepted = 'ConnectionAccepted',
  ConnectionError = 'ConnectionError', Connecting = 'Connecting', ConnectError = 'ConnectError',
  VpnPortalStarted = 'VpnPortalStarted', VpnPortalClientConnected = 'VpnPortalClientConnected',
  VpnPortalClientDisconnected = 'VpnPortalClientDisconnected',
  DhcpIpv4Changed = 'DhcpIpv4Changed', DhcpIpv4Conflicted = 'DhcpIpv4Conflicted',
  PortForwardAdded = 'PortForwardAdded', ProxyCidrsUpdated = 'ProxyCidrsUpdated',
  UdpBroadcastRelayStartResult = 'UdpBroadcastRelayStartResult',
}

export {
  DEFAULT_NETWORK_CONFIG,
  normalizeManualNetworkConfig,
  normalizeNetworkConfig,
  pbjsonSerializeNetworkConfig,
  toBackendNetworkConfig,
} from '../modules/network-config'

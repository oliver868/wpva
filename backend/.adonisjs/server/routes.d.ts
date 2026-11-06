import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.sessions.csrf': { paramsTuple?: []; params?: {} }
    'auth.sessions.store': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'profile.sessions.destroy': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
    'channels.channels.store': { paramsTuple?: []; params?: {} }
    'channels.channels.join': { paramsTuple?: []; params?: {} }
    'channels.channels.invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.kick': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.messages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.send_message': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.update_visibility': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.respond_to_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'auth.sessions.csrf': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
    'channels.channels.messages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'auth.sessions.csrf': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
    'channels.channels.messages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.sessions.store': { paramsTuple?: []; params?: {} }
    'profile.sessions.destroy': { paramsTuple?: []; params?: {} }
    'channels.channels.store': { paramsTuple?: []; params?: {} }
    'channels.channels.join': { paramsTuple?: []; params?: {} }
    'channels.channels.invite': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.revoke': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.kick': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.send_message': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.update_visibility': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.respond_to_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
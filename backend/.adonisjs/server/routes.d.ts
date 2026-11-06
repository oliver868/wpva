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
    'channels.channels.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.update_visibility': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.respond_to_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'auth.sessions.csrf': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.sessions.csrf': { paramsTuple?: []; params?: {} }
    'profile.profile.show': { paramsTuple?: []; params?: {} }
    'channels.channels.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.new_account.store': { paramsTuple?: []; params?: {} }
    'auth.sessions.store': { paramsTuple?: []; params?: {} }
    'profile.sessions.destroy': { paramsTuple?: []; params?: {} }
    'channels.channels.store': { paramsTuple?: []; params?: {} }
    'channels.channels.leave': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.update_visibility': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'channels.channels.respond_to_invitation': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
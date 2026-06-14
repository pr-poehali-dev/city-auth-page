"""
API для редактора карты Городка.
GET  /?action=load   — загрузить все тайлы карты
POST /               — сохранить один тайл или батч {"tiles":[...]}
POST /?action=fill   — залить прямоугольник {x1,y1,x2,y2,tile_type,...}
POST /?action=reset  — сбросить карту к дефолту
"""
import json
import os
import psycopg2

SCHEMA = 't_p71493936_city_auth_page'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

TILE_WALKABLE = {0: True, 1: True, 2: False, 3: False, 4: False, 5: False, 6: False}
TILE_SPRITE   = {0: 'grass', 1: 'road', 2: 'building', 3: 'tree', 4: 'hospital', 5: 'mall', 6: 'prison'}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    qs = event.get('queryStringParameters') or {}
    action = qs.get('action', '')

    try:
        if method == 'GET':
            return get_map()
        if method == 'POST' and action == 'fill':
            return fill_rect(event)
        if method == 'POST' and action == 'reset':
            return reset_map()
        if method == 'POST':
            return save_tiles(event)
        return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'Not found'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': str(e)})}


def get_map():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f'SELECT x, y, tile_type, walkable, sprite_id, props FROM {SCHEMA}.map_tiles ORDER BY y, x'
    )
    rows = cur.fetchall()
    cur.close(); conn.close()
    tiles = [{'x': r[0], 'y': r[1], 'tile_type': r[2], 'walkable': r[3], 'sprite_id': r[4], 'props': r[5] or {}} for r in rows]
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'tiles': tiles, 'count': len(tiles)})}


def upsert_tile(cur, x, y, tile_type, walkable, sprite_id, props_str):
    cur.execute(
        f'''INSERT INTO {SCHEMA}.map_tiles (x, y, tile_type, walkable, sprite_id, props, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s::jsonb,NOW())
            ON CONFLICT (x,y) DO UPDATE SET
              tile_type=EXCLUDED.tile_type, walkable=EXCLUDED.walkable,
              sprite_id=EXCLUDED.sprite_id, props=EXCLUDED.props, updated_at=NOW()''',
        (x, y, tile_type, walkable, sprite_id, props_str)
    )


def save_tiles(event):
    body = json.loads(event.get('body') or '{}')
    items = body.get('tiles', [body] if 'x' in body else [])
    if not items:
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'No tiles'})}

    conn = get_conn(); cur = conn.cursor()
    for t in items:
        tt = int(t.get('tile_type', 0))
        upsert_tile(cur,
            int(t['x']), int(t['y']), tt,
            bool(t.get('walkable', TILE_WALKABLE.get(tt, True))),
            str(t.get('sprite_id', TILE_SPRITE.get(tt, 'grass'))),
            json.dumps(t.get('props', {}))
        )
    conn.commit(); cur.close(); conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'saved': len(items)})}


def fill_rect(event):
    body = json.loads(event.get('body') or '{}')
    x1, y1, x2, y2 = int(body['x1']), int(body['y1']), int(body['x2']), int(body['y2'])
    tt = int(body.get('tile_type', 0))
    walkable  = bool(body.get('walkable', TILE_WALKABLE.get(tt, True)))
    sprite_id = str(body.get('sprite_id', TILE_SPRITE.get(tt, 'grass')))
    props_str = json.dumps(body.get('props', {}))

    conn = get_conn(); cur = conn.cursor()
    count = 0
    for y in range(min(y1,y2), max(y1,y2)+1):
        for x in range(min(x1,x2), max(x1,x2)+1):
            upsert_tile(cur, x, y, tt, walkable, sprite_id, props_str)
            count += 1
    conn.commit(); cur.close(); conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'filled': count})}


def reset_map():
    conn = get_conn(); cur = conn.cursor()
    cur.execute(f'DELETE FROM {SCHEMA}.map_tiles')
    conn.commit(); cur.close(); conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'reset': True})}

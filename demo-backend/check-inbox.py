import os, json, urllib.request, urllib.parse, collections, sys

creds = json.loads(os.environ['FLOWSTACK_GOOGLE_OAUTH_TOKEN'])
data = urllib.parse.urlencode({
    'grant_type': 'refresh_token',
    'refresh_token': creds['refresh_token'],
    'client_id': creds['client_id'],
    'client_secret': creds['client_secret'],
}).encode()
req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
resp = urllib.request.urlopen(req)
token = json.loads(resp.read())['access_token']

url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
messages = result.get('messages', [])

print(f'Letzte {len(messages)} Mails:\n', flush=True)

for i, m in enumerate(messages):
    url2 = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{m['id']}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date"
    req2 = urllib.request.Request(url2, headers={'Authorization': f'Bearer {token}'})
    resp2 = urllib.request.urlopen(req2)
    detail = json.loads(resp2.read())
    headers = {h['name']: h['value'] for h in detail['payload']['headers']}
    print(f"{i+1}. Von: {headers.get('From','?')}", flush=True)
    print(f"   Betreff: {headers.get('Subject','?')}", flush=True)
    print(flush=True)

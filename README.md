Start by running
```bash
docker compose up
```

Insert test user by running the 'create-user.sql' script

Monitor with grafana at http://localhost:3000

Install artillery

```bash
npm install -g artillery
```

Run load test
```bash
artillery run recipe-test.yml
```

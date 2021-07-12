# ghec-report-reinvite-action

> GitHub Action to reinvite users to GitHub Enterprise Cloud organizations after https://github.com/ActionsDesk/ghec-invitations-report-action created a report.

[![test](https://github.com/ActionsDesk/ghec-report-reinvite-action/actions/workflows/test.yml/badge.svg)](https://github.com/ActionsDesk/ghec-report-reinvite-action/actions/workflows/test.yml) [![codeql](https://github.com/ActionsDesk/ghec-report-reinvite-action/actions/workflows/codeql.yml/badge.svg)](https://github.com/ActionsDesk/ghec-report-reinvite-action/actions/workflows/codeql.yml) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Usage

**Scheduled report example**

```yml
on:
  schedule:
    # Runs at 00:00 UTC on the first of every month
    - cron: '0 0 1 * *'

name: Invitations

jobs:
  # use https://github.com/ActionsDesk/ghec-invitations-report-action first to create the report
  report:
    runs-on: ubuntu-latest

    outputs:
      base_sha: ${{ steps.create-report.outputs.base_sha }}
      head_sha: ${{ steps.create-report.outputs.head_sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Create invitations report
        uses: ActionsDesk/ghec-invitations-report-action@v3.0.0
        id: create-report
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          enterprise: 'my-enterprise'
          report_path: 'reports/invitations.csv'

  # reinvite users from the report created in report job above
  reinvite:
    runs-on: ubuntu-latest
    needs: report
    if: ${{ needs.report.outputs }} && ${{ needs.report.outputs.base_sha }} && ${{ needs.report.outputs.head_sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Reinvite users from report
        uses: ActionsDesk/ghec-report-reinvite-action@v2.0.0
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          report_path: 'reports/invitations.csv'
          base_sha: ${{ needs.report.outputs.base_sha }}
          head_sha: ${{ needs.report.outputs.head_sha }}
```

<details>
  <summary><strong>On-demand report example</strong></summary>

```yml
on:
  workflow_dispatch:
    inputs:
      enterprise:
        description: 'GitHub Enterprise Cloud account, if omitted the report will target the repository organization only'
        required: false
        default: 'my-enterprise'
      report_path:
        description: 'Path to the report file'
        default: 'reports/invitations.csv'
        required: false

name: On-demand invitations

jobs:
  # use https://github.com/ActionsDesk/ghec-invitations-report-action first to create the report
  report:
    runs-on: ubuntu-latest

    outputs:
      base_sha: ${{ steps.create-report.outputs.base_sha }}
      head_sha: ${{ steps.create-report.outputs.head_sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Create invitations report
        uses: ActionsDesk/ghec-invitations-report-action@v3.0.0
        id: create-report
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          enterprise: ${{ github.event.inputs.enterprise }}
          report_path: ${{ github.event.inputs.report_path }}

  # reinvite users from the report created in report job above
  reinvite:
    runs-on: ubuntu-latest
    needs: report
    if: ${{ needs.report.outputs }} && ${{ needs.report.outputs.base_sha }} && ${{ needs.report.outputs.head_sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Reinvite users from report
        uses: ActionsDesk/ghec-report-reinvite-action@v2.0.0
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          report_path: ${{ github.event.inputs.report_path }}
          base_sha: ${{ needs.report.outputs.base_sha }}
          head_sha: ${{ needs.report.outputs.head_sha }}
```

</details>

### Action Inputs

| Name          | Description                                                                         | Default                 | Required |
| :------------ | :---------------------------------------------------------------------------------- | :---------------------- | :------- |
| `token`       | A `admin:org`, `read:user`, `user:email` scoped [PAT]                               |                         | `true`   |
| `report_path` | Report CSV file path within the repository                                          | `invitation-report.csv` | `true`   |
| `base_sha`    | Report base SHA, from https://github.com/ActionsDesk/ghec-invitations-report-action |                         | `true`   |
| `head_sha`    | Report head SHA, from https://github.com/ActionsDesk/ghec-invitations-report-action |                         | `true`   |

## License

- [MIT License](./license)

[pat]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token 'Personal Access Token'

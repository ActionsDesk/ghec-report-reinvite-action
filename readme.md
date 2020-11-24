# ghec-report-reinvite-action

> GitHub Action to reinvite users to GitHub Enterprise Cloud organizations after https://github.com/ActionsDesk/ghec-invitations-report-action created a report.

[![Test](https://github.com/ActionsDesk/ghec-report-reinvite-action/workflows/Test/badge.svg)](https://github.com/ActionsDesk/ghec-report-reinvite-action/actions?query=workflow%3ATest) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

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
      base-sha: ${{ steps.create-report.outputs.base-sha }}
      head-sha: ${{ steps.create-report.outputs.head-sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Create invitations report
        uses: ActionsDesk/ghec-invitations-report-action@v2
        id: create-report
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          enterprise: 'my-enterprise'
          report-path: 'reports/invitations.csv'

  # reinvite users from the report created in report job above
  reinvite:
    runs-on: ubuntu-latest
    needs: report
    if: ${{ needs.report.outputs }} && ${{ needs.report.outputs.base-sha }} && ${{ needs.report.outputs.head-sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Reinvite users from report
        uses: ActionsDesk/ghec-report-reinvite-action@v1
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          report-path: 'reports/invitations.csv'
          base-sha: ${{ needs.report.outputs.base-sha }}
          head-sha: ${{ needs.report.outputs.head-sha }}
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
      report-path:
        description: 'Path to the report file'
        default: 'reports/invitations.csv'
        required: false

name: On-demand invitations

jobs:
  # use https://github.com/ActionsDesk/ghec-invitations-report-action first to create the report
  report:
    runs-on: ubuntu-latest

    outputs:
      base-sha: ${{ steps.create-report.outputs.base-sha }}
      head-sha: ${{ steps.create-report.outputs.head-sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Create invitations report
        uses: ActionsDesk/ghec-invitations-report-action@v2
        id: create-report
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          enterprise: ${{ github.event.inputs.enterprise }}
          report-path: ${{ github.event.inputs.report-path }}

  # reinvite users from the report created in report job above
  reinvite:
    runs-on: ubuntu-latest
    needs: report
    if: ${{ needs.report.outputs }} && ${{ needs.report.outputs.base-sha }} && ${{ needs.report.outputs.head-sha }}

    steps:
      - name: Checkout
        uses: actions/checkout@v2

      - name: Reinvite users from report
        uses: ActionsDesk/ghec-report-reinvite-action@v1
        with:
          token: ${{ secrets.ADMIN_TOKEN }}
          report-path: ${{ github.event.inputs.report-path }}
          base-sha: ${{ needs.report.outputs.base-sha }}
          head-sha: ${{ needs.report.outputs.head-sha }}
```

</details>

### Action Inputs

| Name          | Description                                                                         | Default                 | Required |
| :------------ | :---------------------------------------------------------------------------------- | :---------------------- | :------- |
| `token`       | A `admin:org`, `read:user`, `user:email` scoped [PAT]                               |                         | `true`   |
| `report-path` | Report CSV file path within the repository                                          | `invitation-report.csv` | `true`   |
| `base-sha`    | Report base SHA, from https://github.com/ActionsDesk/ghec-invitations-report-action |                         | `true`   |
| `head-sha`    | Report head SHA, from https://github.com/ActionsDesk/ghec-invitations-report-action |                         | `true`   |

## License

- [MIT License](./license)

[pat]: https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token 'Personal Access Token'

class Reinvite {
  /**
   * @typedef {object} Invitee
   * @property {string} org
   * @property {string} login
   * @property {string} email
   * @property {Date} creation_date
   * @property {Date} failed_date
   * @readonly
   */

  /**
   * @param {import('@octokit/core').Octokit} octokit
   * @param {Object} options       Report options
   * @param {String} options.path  Path to the CSV report
   * @param {String} options.base  Base SHA of the report
   * @param {String} options.head  Head SHA of the report
   * @param {String} options.owner Oganization login
   * @param {String} options.repo  Oganization repository
   */
  constructor(octokit, {path, base, head, owner, repo}) {
    this.octokit = octokit
    this.path = path
    this.base = base
    this.head = head
    this.owner = owner
    this.repo = repo
  }

  /**
   * @readonly
   * @returns {object}
   */
  async create() {
    const files = await this.diffReport()

    const reinvites = []
    const failed = []

    for (const file of files) {
      if (file.filename === this.path) {
        const lines = file.patch.split('\n')

        // extract those that have been removed since last report,
        // they are the ones who have
        //    a) accepted their invite already
        //    b) their invite expired
        //    c) their invite was canceled
        for (const l of lines) {
          if (l.indexOf('---') === -1 && l.indexOf('-') === 0) {
            const [org, login, email, creation_date, failed_date] = l.slice(1).split(',')

            if (!failed_date) {
              /** @type Invitee */
              reinvites.push({org, login, email, creation_date, failed_date})
            } else {
              /** @type Invitee */
              failed.push({org, login, email, creation_date, failed_date})
            }
          }
        }
      }
    }

    reinvites.length && this.sendInvite(reinvites)
    failed.length && this.sendInvite(failed)

    return {reinvites, failed}
  }

  /**
   * @readonly
   * @returns {object[]}
   */
  async diffReport() {
    const {octokit, owner, repo, base, head} = this

    try {
      // get the `git diff`
      const {
        data: {files},
      } = await octokit.rest.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      })

      return files
    } catch (error) {
      return []
    }
  }

  /**
   * @readonly
   * @param {Invitee[]} invitees
   */
  async sendInvite(invitees) {
    const {octokit} = this

    for (const {org, login: username, email} of invitees) {
      try {
        const opts = {org}

        if (email) {
          opts.email = email
        } else {
          // get the user id for the username to use for the invitations call
          const {
            data: {id},
          } = await octokit.rest.users.getByUsername({username})

          opts.invitee_id = id
        }

        await octokit.rest.orgs.createInvitation({...opts})
      } catch (error) {
        octokit.log.warn(`skipping ${username}`)
      }
    }
  }
}

module.exports = Reinvite

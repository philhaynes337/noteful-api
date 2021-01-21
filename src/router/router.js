const path = require('path')
const express = require('express')
const xss = require('xss')
const NotefulService = require('../noteful-service')

const notefulRouter = express.Router()
const jsonParser = express.json()

notefulRouter
    .route('/')
        .get((req, res, next) => {
            res.send('You made it!')
        })

notefulRouter
        .route('/api')
           .get((req, res, next) => {
               res.send('API Endpoint ----- nothing here! Only api/notes and api/folders')
           })

notefulRouter
    .route('/api/folders')
    .get((req, res, next) => {
        NotefulService.getAllFolders(
            req.app.get('db')
        )
        .then(folders => {
            res.json(folders)
        })
        .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name } = req.body
        const newFolder = { name }

        if (!name) {
            return res.status(400).json({
                error: { message: `Missing 'Folder Name' in request body` }
            })
        }
        for (const [key, value] of Object.entries(newFolder)) {
        if (value == null) {
            return res.status(400).json({
                error: { message: `Missing '${key}' in request body`}
            })
        }
    }
    NotefulService.insertFolder(
        req.app.get('db'),
        newFolder
    )
        .then(folder => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                .json(folder)
        })
        .catch(next)

    })

notefulRouter
    .route('/api/folders/:folder_id')
    .all((req, res, next) => {
        NotefulService.getByFId(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(folder => {
            if (!folder) {
                return res.status(404).json({
                    error: { message: `Folder doesn't exist` }
                })
            }
            res.folder = folder
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.folder.id,
            name: xss(res.folder.name),
        })
    })
    .delete((req, res, next) => {
        NotefulService.deleteFolder(
            req.app.get('db'),
            req.params.folder_id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name } = req.body
        const folderToUpdate = { name }

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
            if (numberOfValues === 0) {
                return res.status(400).json({
                    error: { message: `Request body must contain 'Name'` }
                })
            }

    NotefulService.updateFolder(
        req.app.get('db'),
        req.params.folder_id,
        folderToUpdate
    )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })


notefulRouter
    .route('/api/notes')
    .get((req, res, next) => {
        NotefulService.getAllNotes(
            req.app.get('db')
        )
            .then(notes => {
                res.json(notes)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { name, modified, folderid, content } = req.body
        const newNote = { name, folderid, content }

        if (!name) {
            return res.status(400).json({
                error: { message: `Missing 'Name' in request body` }
            })
        }

        if (!folderid) {
            return res.status(400).json({
                error: { message: `Missing 'Folder ID' in request body` }
            })
        }

        if (!content) {
            return res.status(400).json({
                error: { message: `Missing 'Content' in request body` }
            })
        }

        for (const [key, value] of Object.entries(newNote)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body`}
                })
            }
        }

    NotefulService.insertNote(
        req.app.get('db'),
        newNote
    )
        .then(note => {
            res
                .status(201)
                .location(path.posix.join(req.originalUrl, `/${note.id}`))
                .json(note)
        })
        .catch(next)

    })

notefulRouter
    .route('/api/notes/:note_id')
    .all((req, res, next) => {
        NotefulService.getById(
            req.app.get('db'),
            req.params.note_id
        )
        .then(note => {
            if (!note) {
                return res.status(404).json({
                    error: { message: `Note doesn't exist` }
                })
            }
            res.note = note
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.note.id,
            name: xss(res.note.name),
            folderid: res.note.folderid,
            modified: res.note.modified,
            content: xss(res.note.content),
        })
    })
    .delete((req, res, next) => {
        NotefulService.deleteNote(
            req.app.get('db'),
            req.params.note_id
        )
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const { name, folderid, content } = req.body
        const noteToUpdate = { name, folderid, content }

        const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length
            if (numberOfValues === 0) {
                return res.status(400).json({
                    error: { message: `Request body must contain 'Name', 'Folder ID', and 'Content'` }
                })
            }

    NotefulService.updateNote(
        req.app.get('db'),
        req.params.note_id,
        noteToUpdate
    )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })



module.exports = notefulRouter;
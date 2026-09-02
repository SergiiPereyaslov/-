'use strict';

const express = require('express');
const tenancy = require('../tenancy');
const course = require('../course');
const profile = require('../profile');

const router = express.Router();

router.get('/', tenancy.requireAuth, (req, res) => {
  if (!req.tenantId) {
    return res.render('dashboard', {
      title: 'Тренажер', lectures: [], done: null, completeness: null, nextLecture: null,
    });
  }

  const lectures = course.progressFor(req.tenantId, req.user.id);
  const data = profile.load(req.tenantId);

  res.render('dashboard', {
    title: 'Тренажер',
    lectures,
    done: course.summary(req.tenantId, req.user.id),
    completeness: profile.completeness(data),
    nextLecture: lectures.find((l) => l.unlocked && !l.passed) || null,
  });
});

module.exports = router;

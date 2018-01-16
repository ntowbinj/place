import logging
import config

log = logging.FileHandler(config.logpath)
log.setLevel(logging.INFO)

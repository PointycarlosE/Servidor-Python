from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.config import RATELIMIT_DEFAULT


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[RATELIMIT_DEFAULT],
    storage_uri="memory://",
)

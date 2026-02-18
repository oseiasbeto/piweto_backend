router.get('/comments/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const sortBy = req.query.sortBy || 'recents';
    const filterBy = req.query.filterBy || null;

    let sort;
    switch (sortBy) {
      case 'recents':
        sort = { createdAt: -1 };
        break;
      case 'relevant':
        sort = { reactionCount.likes: -1 };
        break;
      case 'mostLiked':
        sort = { 'reactionCount.likes': -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const comments = await Comment.aggregate([
      {
        $match: { postId: mongoose.Types.ObjectId(postId), parentId: null }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'parentId',
          as: 'replies'
        }
      },
      {
        $addFields: {
          replies: { $slice: ['$replies', 3] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          content: 1,
          reactionCount: 1,
          createdAt: 1,
          user: {
            _id: 1,
            name: 1,
            profilePicture: 1
          },
          replies: {
            $map: {
              input: '$replies',
              as: 'reply',
              in: {
                _id: '$$reply._id',
                content: '$$reply.content',
                reactionCount: '$$reply.reactionCount',
                createdAt: '$$reply.createdAt',
                user: {
                  $let: {
                    vars: {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: 'users',
                              cond: { $eq: ['$$this._id', '$$reply.userId'] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      _id: '$$user._id',
                      name: '$$user.name',
                      profilePicture: '$$user.profilePicture'
                    }
                  }
                }
              }
            }
          }
        }
      },
      {
        $sort: sort
      },
      {
        $skip: (page - 1) * limit
      },
      {
        $limit: limit
      }
    ]);

    const totalComments = await Comment.countDocuments({ postId: mongoose.Types.ObjectId(postId), parentId: null });
    const totalPages = Math.ceil(totalComments / limit);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        totalPages,
        totalComments
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar comentários' });
  }
});
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { AlertCircle, Flag, MessageCircle, Eye, X } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { Card } from '@/src/components/common/Card';
import {
  getPendingPostReports,
  getPendingCommentReports,
  dismissReport,
  markReportReviewed,
  hidePost,
  hideComment,
} from '@/src/services/adminService';
import type { PostReport, CommentReport } from '@/src/types';

type ReportType = 'posts' | 'comments';

export default function ReportsQueueScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [activeTab, setActiveTab] = useState<ReportType>('posts');
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [commentReports, setCommentReports] = useState<CommentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setError(null);
      const [posts, comments] = await Promise.all([
        getPendingPostReports(),
        getPendingCommentReports(),
      ]);
      setPostReports(posts);
      setCommentReports(comments);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReports();
  };

  const handleHideContent = (reportId: string, contentId: string, type: 'post' | 'comment') => {
    Alert.prompt(
      `Hide ${type === 'post' ? 'Post' : 'Comment'}`,
      'Enter reason for hiding this content:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason || !reason.trim()) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }
            try {
              if (type === 'post') {
                await hidePost(contentId, { reason: reason.trim() });
              } else {
                await hideComment(contentId, { reason: reason.trim() });
              }
              await markReportReviewed(reportId, type);
              await loadReports();
              Alert.alert('Success', `${type === 'post' ? 'Post' : 'Comment'} hidden successfully`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to hide content');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleDismissReport = (reportId: string, type: 'post' | 'comment') => {
    Alert.alert(
      'Dismiss Report',
      'Mark this report as reviewed without taking action?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss',
          onPress: async () => {
            try {
              await dismissReport(reportId, type);
              await loadReports();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to dismiss report');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const reports = activeTab === 'posts' ? postReports : commentReports;
  const totalPending = postReports.length + commentReports.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('posts')}
        >
          <Flag
            size={18}
            color={activeTab === 'posts' ? COLORS.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'posts' ? COLORS.accent : colors.textSecondary,
              },
            ]}
          >
            Post Reports ({postReports.length})
          </Text>
          {activeTab === 'posts' && (
            <View style={[styles.activeIndicator, { backgroundColor: COLORS.accent }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('comments')}
        >
          <MessageCircle
            size={18}
            color={activeTab === 'comments' ? COLORS.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'comments' ? COLORS.accent : colors.textSecondary,
              },
            ]}
          >
            Comment Reports ({commentReports.length})
          </Text>
          {activeTab === 'comments' && (
            <View style={[styles.activeIndicator, { backgroundColor: COLORS.accent }]} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View style={[styles.errorBanner, { backgroundColor: COLORS.error + '20' }]}>
            <AlertCircle size={20} color={COLORS.error} />
            <Text style={[styles.errorText, { color: COLORS.error }]}>{error}</Text>
          </View>
        )}

        {totalPending === 0 ? (
          <Card isDark={isDark}>
            <View style={styles.emptyState}>
              <Flag size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Pending Reports
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                All reports have been reviewed
              </Text>
            </View>
          </Card>
        ) : reports.length === 0 ? (
          <Card isDark={isDark}>
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No {activeTab === 'posts' ? 'Post' : 'Comment'} Reports
              </Text>
            </View>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} isDark={isDark} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={[styles.reportBadge, { backgroundColor: COLORS.warning + '20' }]}>
                  <Flag size={14} color={COLORS.warning} />
                  <Text style={[styles.reportBadgeText, { color: COLORS.warning }]}>
                    {report.reason}
                  </Text>
                </View>
                <Text style={[styles.reportTime, { color: colors.textSecondary }]}>
                  {formatDate(report.created_at)}
                </Text>
              </View>

              <Text style={[styles.reporterInfo, { color: colors.textSecondary }]}>
                Reported by{' '}
                {report.reporter_profile?.display_name || 'Unknown User'}
              </Text>

              {report.description && (
                <Text style={[styles.reportDescription, { color: colors.text }]}>
                  {report.description}
                </Text>
              )}

              {activeTab === 'posts' && (report as PostReport).post?.caption && (
                <View style={[styles.contentPreview, { backgroundColor: colors.background }]}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                    Post Caption:
                  </Text>
                  <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={3}>
                    {(report as PostReport).post?.caption}
                  </Text>
                </View>
              )}

              {activeTab === 'comments' && (report as CommentReport).comment?.content && (
                <View style={[styles.contentPreview, { backgroundColor: colors.background }]}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                    Comment:
                  </Text>
                  <Text style={[styles.previewText, { color: colors.text }]} numberOfLines={3}>
                    {(report as CommentReport).comment?.content}
                  </Text>
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: COLORS.error + '20' },
                  ]}
                  onPress={() =>
                    handleHideContent(
                      report.id,
                      activeTab === 'posts'
                        ? (report as PostReport).post_id
                        : (report as CommentReport).comment_id,
                      activeTab === 'posts' ? 'post' : 'comment'
                    )
                  }
                >
                  <Eye size={16} color={COLORS.error} />
                  <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
                    Hide Content
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.surfaceElevated },
                  ]}
                  onPress={() =>
                    handleDismissReport(report.id, activeTab === 'posts' ? 'post' : 'comment')
                  }
                >
                  <X size={16} color={colors.textSecondary} />
                  <Text
                    style={[styles.actionButtonText, { color: colors.textSecondary }]}
                  >
                    Dismiss
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  contentContainer: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  reportCard: {
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  reportBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reportTime: {
    fontSize: 12,
  },
  reporterInfo: {
    fontSize: 13,
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  contentPreview: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

using Xunit;
using FluentAssertions;
using Moq;
using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using ChronosNote.Core.Interfaces;

namespace ChronosNote.Core.Services;

public class ReminderServiceTests
{
    private readonly Mock<IBackgroundJobQueue> _jobQueueMock;
    private readonly Mock<IReminderParser> _parserMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly ReminderService _reminderService;

    public ReminderServiceTests()
    {
        _jobQueueMock = new Mock<IBackgroundJobQueue>();
        _parserMock = new Mock<IReminderParser>();
        _notificationServiceMock = new Mock<INotificationService>();

        _reminderService = new ReminderService(
            _jobQueueMock.Object,
            _parserMock.Object,
            _notificationServiceMock.Object
        );
    }

    [Fact]
    public void CreateReminder_Should_Do_Nothing_When_Text_Is_Not_A_Reminder_Command()
    {
        int noteId = 123;
        string text = "Regular text";
        _parserMock.Setup(p => p.IsReminderCommand(text)).Returns(false);

        _reminderService.CreateReminder(noteId, text, "expression");

        _parserMock.Verify(p => p.Parse(It.IsAny<string>()), Times.Never);
        _jobQueueMock.Verify(q => q.Schedule(It.IsAny<Expression<Func<Task>>>(), It.IsAny<DateTimeOffset>()), Times.Never);
    }

    [Fact]
    public void CreateReminder_Should_Schedule_Background_Job_When_Command_Is_Valid()
    {
        int noteId = 456;
        string text = "/remind Buy milk in 10 minutes";
        var expectedTime = DateTimeOffset.UtcNow.AddMinutes(10);
        
        _parserMock.Setup(p => p.IsReminderCommand(text)).Returns(true);
        _parserMock.Setup(p => p.Parse(text)).Returns(("Buy milk", expectedTime));

        _reminderService.CreateReminder(noteId, text, "expression");

        _jobQueueMock.Verify(q => q.Schedule(
            It.IsAny<Expression<Func<Task>>>(),
            It.IsInRange(expectedTime.AddSeconds(-1), expectedTime.AddSeconds(1), Moq.Range.Inclusive)),
            Times.Once
        );
    }

    [Fact]
    public async Task DispatchReminderAsync_Should_Invoke_NotificationService_Correctly()
    {
        int noteId = 789;
        string message = "Clean my room";
        _notificationServiceMock.Setup(n => n.SendReminderAlertAsync(noteId, message)).Returns(Task.CompletedTask);

        await _reminderService.DispatchReminderAsync(noteId, message);

        _notificationServiceMock.Verify(n => n.SendReminderAlertAsync(noteId, message), Times.Once);
    }
}